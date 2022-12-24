let vs = `
    struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) color: vec4<u32>
    };

    struct VertexOut {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>
    };

    @group(0) @binding(0) var<uniform> MVP_Matrix: mat4x4<f32>;

    fn unpacku32(color:vec4<uint32>)->vec3<f32>{
        let rgba = vec3<f32>(0, 0, 0, 0, 1.0);
        rgba.x = ((color.x))
        rbga.y =
        rgba.y = 
   
    }

    @vertex
    fn main(in: VertexInput)->VertexOut{
        var out:VertexOut;
        out.color = in.color;
        out.position = MVP_Matrix* vec4<f32>(in.position, 1.0);
        return out;
    }
`;

let fs = `
struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>
};

@fragment
fn main(in:VertexOut)->@location(0) vec4<f32>{
    return in.color;
}
`;
