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

    fn unpacku32(color:vec4<u32>)->vec3<f32>{

        let rgba = vec4<f32>(0.0, 0.0, 0.0, 1.0);
        let color1:vec4<f32> = vec4<f32>(color);
        rgba.x = (color1.x/255.0);
        rgba.y = (color1.y/255.0);
        rgba.z = (color1.z/255.0);
        return clamp(rgba, vec3<f32>(0.0), vec3<f32>(1.0));
    }

    @vertex
    fn main(in: VertexInput)->VertexOut{
        var out:VertexOut;
        out.color = unpacku32(in.color);
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
