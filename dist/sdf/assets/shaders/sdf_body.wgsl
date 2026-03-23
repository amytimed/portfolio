#import bevy_sprite::mesh2d_vertex_output::VertexOutput

struct SdfBodyUniforms {
    body_color: vec4<f32>,
    stroke_color: vec4<f32>,
    stroke_width_grid: f32,
    has_stroke: u32,
    _pad0: u32,
    _pad1: u32,
}

@group(2) @binding(0) var<uniform> mat: SdfBodyUniforms;
@group(2) @binding(1) var sdf_tex: texture_2d<f32>;
@group(2) @binding(2) var sdf_samp: sampler;

@fragment
fn fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    // Remap mesh UV (0→1 over grid pixels 0→W-1) to GPU texel-center coordinates.
    // GPU texel G has its center at (G+0.5)/W, not G/(W-1). Without this correction
    // the shader samples up to 0.5 texels off at the edges, causing the rendered
    // boundary to not match the gizmo zero-crossing.
    let tex_size = vec2<f32>(textureDimensions(sdf_tex));
    let uv = (in.uv * (tex_size - vec2<f32>(1.0)) + vec2<f32>(0.5)) / tex_size;

    // SDF values in grid-pixel units: negative = inside body, 0 = boundary.
    let dist = textureSample(sdf_tex, sdf_samp, uv).r;

    // fwidth gives the screen-pixel rate-of-change of dist (~grid pixels per screen pixel).
    // Clamp to prevent collapse at very high zoom.
    let aa = max(fwidth(dist), 0.0001);

    if mat.has_stroke == 0u {
        // smoothstep(aa, 0, dist): fully opaque at dist<=0 (zero-crossing),
        // fades to zero over [0, aa] outside. Body is solid right up to the gizmo line.
        let alpha = smoothstep(aa, 0.0, dist) * mat.body_color.a;
        if alpha < 0.001 { discard; }
        return vec4<f32>(mat.body_color.rgb, alpha);
    }

    let sw = mat.stroke_width_grid;

    // Outer edge: fully opaque at dist=0, fades outward over aa.
    let edge_alpha   = smoothstep(aa, 0.0, dist);
    // Fill region: use a wider (2×aa) transition for a softer stroke/fill blend.
    let body_alpha   = smoothstep(-sw + aa, -sw - aa, dist);
    let border_alpha = edge_alpha - body_alpha;

    // Each region uses its own alpha channel independently.
    let fill_alpha   = body_alpha   * mat.body_color.a;
    let stroke_alpha = border_alpha * mat.stroke_color.a;
    let total = fill_alpha + stroke_alpha;
    if total < 0.001 { discard; }

    let color = (fill_alpha * mat.body_color.rgb + stroke_alpha * mat.stroke_color.rgb)
              / max(total, 0.001);
    return vec4<f32>(color, total);
}
