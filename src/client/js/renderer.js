let adapter = null;
let device = null;
let worldViewProjectionMatrix = mat4.create();
let context = null;
let swapChainFormat = "bgra8unorm";
let renderPipeline;

let positionBuffer;
let colorBuffer;
let MVP_Matrix;

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

  let canvas = document.getElementById("screen-canvas");
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

async function initShadowPipeline() {
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
    buffers: [positionAttribute_Desc, colorAttribute_Desc],
  };

  let Fragment_Shader_Descriptor = {
    module: fs_module,
    entryPoint: main,
    target: [{ format: swapChainFormat }],
  };

  let Depth_Stencil_Descriptor = {
    foramt: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less",
  };

  let Primitive_Descriptor = {
    topology: "point-list",
    cullMode: "none",
  }(
    (renderPipeline = await device.createRenderPipeline({
      label: "render pipeline",
      layout: { bindGroupLayouts: [] },
      vertex: Vertex_Shader_Descriptor,
      fragment: Fragment_Shader_Descriptor,
      depthStencil: Depth_Stencil_Descriptor,
      primitive: Primitive_Descriptor,
    }))
  );
}

async function initVertexBuffer() {}

async function stages() {
  await init();
  await initShadowPipeline();
  await initVertexBuffer();
}

stages();
