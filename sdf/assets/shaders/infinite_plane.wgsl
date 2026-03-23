#import bevy_sprite::mesh2d_vertex_output::VertexOutput

struct PlaneUniforms {
    fill_color:   vec4<f32>,
    stroke_color: vec4<f32>,
    normal:       vec2<f32>,
    plane_offset: f32,
    stroke_width: f32,   // world units
    has_stroke:   u32,
    _pad0: u32,
    _pad1: u32,
}

@group(2) @binding(0) var<uniform> mat: PlaneUniforms;

@fragment
fn fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    // Signed distance from the plane surface in world units.
    // Positive = above plane (outside solid), negative = inside solid.
    let dist = dot(in.world_position.xy, mat.normal) - mat.plane_offset;

    let aa = max(fwidth(dist), 0.0001);

    if mat.has_stroke == 1u {
        let sw = mat.stroke_width;
        let edge_alpha   = smoothstep(aa, 0.0, dist);
        let fill_alpha   = smoothstep(-sw + aa, -sw - aa, dist);
        let stroke_alpha = (edge_alpha - fill_alpha) * mat.stroke_color.a;
        let body_alpha   = fill_alpha * mat.fill_color.a;
        let total = body_alpha + stroke_alpha;
        if total < 0.001 { discard; }
        let color = (body_alpha * mat.fill_color.rgb + stroke_alpha * mat.stroke_color.rgb)
                  / max(total, 0.001);
        return vec4<f32>(color, total);
    } else {
        let alpha = smoothstep(aa, 0.0, dist) * mat.fill_color.a;
        if alpha < 0.001 { discard; }
        return vec4<f32>(mat.fill_color.rgb, alpha);
    }
}
