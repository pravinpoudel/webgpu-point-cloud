let adapter = null;
let device = null;
let mvp = mat4.create();
let proj;
let camera;
let context = null;
let swapChainFormat = "bgra8unorm";
let renderPipeline;
let mvp_BG;
let positionBuffer;
let colorBuffer;
let MVP_Buffer;
let shadowDepthTexture;
let commandEncoder;
let renderPassDescriptor;
let canvas;

function configureSwapChain(device) {
  context.configure({
    device: device,
    format: swapChainFormat,
    usage: GPUTextureUsage.RenderAttachment,
    alphaMode: "premultiplied",
  });
}

function goToFallback() {
  console.error("unable to start webgpu");
  return;
}

function recoverFromDeviceLoss(data) {
  console.log("device is lost");
}

async function init() {
  adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return goToFallback();
  device = await adapter.requestDevice();
  if (!device) return goToFallback();
  // device.lost.then(recoverFromDeviceLoss);

  canvas = document.getElementById("screen-canvas");
  context = canvas.getContext("webgpu");
  if (!context) {
    console.error("coould not get context from the canvas");
    return;
  }
  canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);

  swapChainFormat = navigator.gpu.getPreferredCanvasFormat();
  configureSwapChain(device);
}

async function intRenderPipeline() {
  let Vertex_Buffer_Descriptor = [{}];

  let vs_module = device.createShaderModule({
    label: "vertex shader",
    code: vs,
  });
  let fs_module = device.createShaderModule({
    label: "fragment shader",
    code: fs,
  });

  let positionAttribute_Desc = {
    shaderLocation: 0,
    offset: 0,
    format: "float32x3",
  };
  let colorAttribute_Desc = {
    shaderLocation: 1,
    offset: 0,
    format: "uint8x4",
  };

  let Vertex_Shader_Descriptor = {
    module: vs_module,
    entryPoint: "main",
    buffers: [
      {
        arrayStride: 12,
        attributes: [positionAttribute_Desc],
      },
      {
        arrayStride: 4,
        attributes: [colorAttribute_Desc],
      },
    ],
  };

  let Fragment_Shader_Descriptor = {
    module: fs_module,
    entryPoint: "main",
    targets: [{ format: swapChainFormat }],
  };

  let Depth_Stencil_Descriptor = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less",
  };

  let Primitive_Descriptor = {
    topology: "point-list",
    cullMode: "none",
  };

  renderPipeline = await device.createRenderPipeline({
    label: "render pipeline",
    layout: "auto",
    vertex: Vertex_Shader_Descriptor,
    fragment: Fragment_Shader_Descriptor,
    depthStencil: Depth_Stencil_Descriptor,
    primitive: Primitive_Descriptor,
  });
}

async function initVertexBuffer() {
  // lasFile.colors
  // lasFile.positions
  let totalNumberOfPoints = lasFile.numLoadedPoints;

  positionBuffer = device.createBuffer({
    label: "vertex position buffer",
    size: totalNumberOfPoints * 12,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  let mapArrayPosition = new Float32Array(positionBuffer.getMappedRange());
  mapArrayPosition.set(lasFile.positions);
  positionBuffer.unmap();

  colorBuffer = device.createBuffer({
    label: "vertex color buffer",
    size: totalNumberOfPoints * 4,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  let mapArrayColor = new Uint8Array(colorBuffer.getMappedRange());
  mapArrayColor.set(lasFile.positions);
  colorBuffer.unmap();
}

function initUniform() {
  MVP_Buffer = device.createBuffer({
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  camera = new ArcballCamera([0, 0, 3], [0, 0, 0], [0, 1, 0], 0.5, [
    canvas.width,
    canvas.height,
  ]);

  proj = mat4.perspective(
    mat4.create(),
    (50 * Math.PI) / 180.0,
    canvas.width / canvas.height,
    0.1,
    100
  );
  var controller = new Controller();
  controller.mousemove = function (prev, cur, evt) {
    if (evt.buttons == 1) {
      camera.rotate(prev, cur);
    } else if (evt.buttons == 2) {
      camera.pan([cur[0] - prev[0], prev[1] - cur[1]]);
    }
  };
  controller.wheel = function (amt) {
    camera.zoom(amt);
  };
  controller.pinch = controller.wheel;
  controller.twoFingerDrag = function (drag) {
    camera.pan(drag);
  };
  controller.registerForCanvas(canvas);
}

async function createBindGroups() {
  mvp_BG = device.createBindGroups({
    lbael: "uniform bindgroup - rendering",
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: MVP_Buffer,
        },
      },
    ],
  });
}

async function createDepthBuffer() {
  renderDepthTexture = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

async function encodedCommand() {
  // create render pass descriptor

  let colorAttachment = {
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
    loadOp: "clear",
    storeOp: "store",
  };

  let depthAttachment = {
    view: renderDepthTexture.createView(),
    depthLoadOp: "clear",
    depthStoreOp: "store",
    stencilLoadOp: "clear",
    stencilStoreOp: "store",
    depthClearValue: 1.0,
  };

  renderPassDescriptor = {
    colorAttachments: [colorAttachment],
    depthStencilAttachment: depthAttachment,
  };
}
async function stages() {
  await init();
  await intRenderPipeline();
  await initVertexBuffer();
  await initUniform();
  await createDepthBuffer();
  commandEncoder = device.createCommandEncoder();
}

function render() {
  mvp = mat4.mul(mvp, proj, camera.camera);
  encodedCommand();
  device.queue.writeBuffer(MVP_Buffer, 0, mvp, 16);
  let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(renderPipeline);
  passEncoder.setViewport(0, 0, canvas.width, canvas.height);
  passEncoder.setVertexBuffer(0, positionBuffer);
  passEncoder.setVertexBuffer(1, colorBuffer);
  passEncoder.draw(lasFile.numLoadedPoints, 1);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
}
