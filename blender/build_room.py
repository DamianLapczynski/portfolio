"""
Pokój Damiana — cała scena budowana w Blenderze z kodu.

Uruchomienie (Blender 4.2+ albo moduł `bpy` z PyPI):
    blender -b -P blender/build_room.py             # eksport GLB
    blender -b -P blender/build_room.py -- --render # + podgląd Cycles (blender/preview.png)
    python  blender/build_room.py [--render]        # to samo z `pip install bpy`

Wynik: assets/models/room.glb

Konwencje nazw (czyta je assets/js/app.js):
    item_<id>    pusty obiekt-rodzic klikalnego przedmiotu (id jak w content.js)
    tex_<nazwa>  powierzchnia, na którą przeglądarka nakłada teksturę z tekstem
    anim_<nazwa> element animowany w przeglądarce (globus, oczy JARVIS-a)
Współrzędne Blendera: X w prawo, Y w głąb pokoju (tylna ściana na Y=3), Z w górę.
"""
import bpy, bmesh, math, os, random, sys
from mathutils import Vector, Matrix

random.seed(7)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "models", "room.glb"))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]

bpy.ops.wm.read_factory_settings(use_empty=True)
COLL = bpy.context.scene.collection

# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------
def lin(hexcol):
    h = hexcol.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

MATS = {}
def mat(name, color, rough=0.6, metal=0.0, emit=None, strength=1.0, transmission=0.0, double=False, coat=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*lin(color), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1)
        b.inputs["Emission Strength"].default_value = strength
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    m.use_backface_culling = not double
    m.diffuse_color = (*lin(color), 1)
    MATS[name] = m
    return m

W = {
    "wall": mat("wall", "#2c2a28", 0.95),
    "wall_side": mat("wall_side", "#24282a", 0.95),
    "trim": mat("trim", "#1c1b1a", 0.6),
    "subfloor": mat("subfloor", "#120d09", 1.0),
    "walnut": mat("walnut", "#5b3a24", 0.45, coat=0.3),
    "walnut_dark": mat("walnut_dark", "#3a2416", 0.5),
    "oak": mat("oak", "#8a6440", 0.55),
    "felt": mat("felt", "#1a1b1d", 1.0),
    "black_metal": mat("black_metal", "#141416", 0.35, 0.7),
    "steel": mat("steel", "#8d9096", 0.25, 1.0),
    "alu": mat("alu", "#b9bcc2", 0.3, 1.0),
    "plastic_dark": mat("plastic_dark", "#202125", 0.4),
    "brass": mat("brass", "#c99a4f", 0.28, 1.0),
    "gold": mat("gold", "#e2b85a", 0.22, 1.0),
    "ivory": mat("ivory", "#ece2cc", 0.55),
    "disc": mat("disc", "#7fb7c8", 0.4),
    "teal": mat("teal", "#2f8f8a", 0.35),
    "teal_fabric": mat("teal_fabric", "#2f5553", 0.95),
    "cream": mat("cream", "#e9e1d2", 0.6),
    "paper": mat("paper", "#f1e9d8", 0.9),
    "led": mat("led", "#ffd3a0", 0.5, emit="#ffb866", strength=6.0),
    "led_cool": mat("led_cool", "#bfe9ff", 0.5, emit="#7fd8ff", strength=4.0),
    "screen": mat("screen", "#0e0f12", 0.3, emit="#ffffff", strength=1.0),
    "glass": mat("glass", "#e6f4ff", 0.05, transmission=1.0),
    "leaf": mat("leaf", "#3c7a4b", 0.55, double=True),
    "leaf_dark": mat("leaf_dark", "#2a5a37", 0.55, double=True),
    "stem": mat("stem", "#4f7339", 0.7),
    "soil": mat("soil", "#2a1d14", 1.0),
    "terracotta": mat("terracotta", "#a9573a", 0.85),
    "ceramic_white": mat("ceramic_white", "#e7e2d8", 0.35),
    "purple": mat("purple", "#2a1548", 0.6),
    "rug": mat("rug", "#1e2224", 1.0),
    "rug_line": mat("rug_line", "#2c7a7d", 1.0),
    "rug_line_light": mat("rug_line_light", "#d9ccb4", 1.0),
}

# ---------------------------------------------------------------------------
# Geometry helpers (all build with bmesh, so modifiers stay simple)
# ---------------------------------------------------------------------------
PARENT = [None]

def _link(name, bm, material, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True, bevel=0.0, bevel_seg=3, sharp_angle=40):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COLL.objects.link(ob)
    if isinstance(material, (list, tuple)):
        for m in material:
            me.materials.append(m)
    else:
        me.materials.append(material)
    if smooth:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(sharp_angle))
    if bevel > 0:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = bevel_seg
        mod.limit_method = "ANGLE"
        mod.harden_normals = True
    ob.location = loc
    ob.rotation_euler = rot
    if PARENT[-1] is not None:
        ob.parent = PARENT[-1]
    return ob

def _uv(bm):
    return bm.loops.layers.uv.verify()

def bm_box(bm, w, d, h, center=(0, 0, 0)):
    res = bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=res["verts"])
    bmesh.ops.translate(bm, vec=center, verts=res["verts"])
    return res["verts"]

def box(name, w, d, h, loc, material, bevel=0.0, rot=(0, 0, 0)):
    bm = bmesh.new(); _uv(bm)
    bm_box(bm, w, d, h)
    return _link(name, bm, material, loc, rot, bevel=min(bevel, min(w, d, h) * 0.45))

def cyl(name, r1, r2, h, loc, material, seg=32, rot=(0, 0, 0), bevel=0.0):
    bm = bmesh.new(); _uv(bm)
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h, calc_uvs=True)
    return _link(name, bm, material, loc, rot, bevel=bevel, sharp_angle=50)

def sphere(name, r, loc, material, seg=32, scale=(1, 1, 1), rot=(0, 0, 0)):
    bm = bmesh.new(); _uv(bm)
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(12, seg // 2), radius=r, calc_uvs=True)
    bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
    return _link(name, bm, material, loc, rot, sharp_angle=80)

def plane(name, w, h, loc, material, rot=(math.pi / 2, 0, 0)):
    """Vertical plane facing -Y (toward the camera) by default; UV v=1 is up."""
    bm = bmesh.new(); _uv(bm)
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
    bmesh.ops.scale(bm, vec=(w, h, 1), verts=bm.verts)
    return _link(name, bm, material, loc, rot, smooth=False)

def tube(name, pts, radius, material, ring=10, closed=False, loc=(0, 0, 0), rot=(0, 0, 0), caps=True):
    """Sweep a circle along a polyline (parallel-transport frames)."""
    pts = [Vector(p) for p in pts]
    n = len(pts)
    bm = bmesh.new(); _uv(bm)
    tangents = []
    for i in range(n):
        if closed:
            t = pts[(i + 1) % n] - pts[i - 1]
        else:
            t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        tangents.append(t.normalized())
    ref = Vector((0, 0, 1)) if abs(tangents[0].z) < 0.9 else Vector((1, 0, 0))
    normal = tangents[0].cross(ref).normalized()
    rings = []
    for i in range(n):
        if i > 0:
            axis = tangents[i - 1].cross(tangents[i])
            if axis.length > 1e-6:
                ang = tangents[i - 1].angle(tangents[i])
                normal = (Matrix.Rotation(ang, 3, axis.normalized()) @ normal).normalized()
        binormal = tangents[i].cross(normal)
        rings.append([bm.verts.new(pts[i] + radius * (math.cos(a) * normal + math.sin(a) * binormal))
                      for a in [2 * math.pi * k / ring for k in range(ring)]])
    segs = n if closed else n - 1
    for i in range(segs):
        a, b = rings[i], rings[(i + 1) % n]
        for k in range(ring):
            bm.faces.new((a[k], a[(k + 1) % ring], b[(k + 1) % ring], b[k]))
    if caps and not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bm.normal_update()
    return _link(name, bm, material, loc, rot, sharp_angle=70)

def arc_pts(r, a0, a1, n=32, plane="xz"):
    out = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        x, y = r * math.cos(a), r * math.sin(a)
        out.append((x, 0, y) if plane == "xz" else (x, y, 0))
    return out

def leaf(name, length, width, material, loc, rot, fenestrated=False):
    """Flat leaf from an outline, slightly cupped."""
    bm = bmesh.new(); _uv(bm)
    n = 18
    left, right = [], []
    for i in range(n + 1):
        t = i / n
        w = width * math.sin(math.pi * t) ** 0.8 * (1 - 0.25 * t)
        z = length * t
        cup = 0.18 * w
        left.append(bm.verts.new((-w, cup, z)))
        right.append(bm.verts.new((w, cup, z)))
    mid = [bm.verts.new((0, 0, length * i / n)) for i in range(n + 1)]
    for i in range(n):
        bm.faces.new((mid[i], mid[i + 1], left[i + 1], left[i]))
        bm.faces.new((mid[i], right[i], right[i + 1], mid[i + 1]))
    bm.normal_update()
    return _link(name, bm, material, loc, rot, sharp_angle=80)

class item:
    """Group objects under an empty named item_<id> (clickable in the browser)."""
    def __init__(self, item_id, loc, rot_z=0.0):
        self.e = bpy.data.objects.new(f"item_{item_id}", None)
        self.e.empty_display_size = 0.1
        COLL.objects.link(self.e)
        self.e.location = loc
        self.e.rotation_euler = (0, 0, rot_z)
        if PARENT[-1] is not None:
            self.e.parent = PARENT[-1]
    def __enter__(self):
        PARENT.append(self.e); return self.e
    def __exit__(self, *a):
        PARENT.pop()

class grp(item):
    """Plain (non-clickable) group."""
    def __init__(self, name, loc, rot_z=0.0):
        super().__init__("x", loc, rot_z)
        self.e.name = f"grp_{name}"

# ---------------------------------------------------------------------------
# Room shell
# ---------------------------------------------------------------------------
X0, X1, Y0, Y1, H = -3.2, 3.4, -1.6, 3.0, 3.0

# floor planks (merged per colour variant)
plank_cols = ["#6b4a31", "#5e3f29", "#74513a", "#664530", "#57392a"]
plank_mats = [mat(f"plank{i}", c, 0.5 + 0.05 * i, coat=0.15) for i, c in enumerate(plank_cols)]
bms = [bmesh.new() for _ in plank_cols]
for b in bms: _uv(b)
pw, gap = 0.16, 0.004
row = 0
x = X0
while x < X1:
    y = Y0 - random.random() * 1.2
    while y < Y1:
        ln = random.uniform(0.9, 1.6)
        y_end = min(y + ln, Y1)
        y_start = max(y, Y0)
        if y_end - y_start > 0.02:
            k = random.randrange(len(bms))
            bm_box(bms[k], pw - gap, (y_end - y_start) - gap, 0.02, (x + pw / 2, (y_start + y_end) / 2, -0.01))
        y += ln
    x += pw
    row += 1
for i, b in enumerate(bms):
    _link(f"floor_{i}", b, plank_mats[i], bevel=0.0015, bevel_seg=1)
box("subfloor", X1 - X0, Y1 - Y0, 0.01, ((X0 + X1) / 2, (Y0 + Y1) / 2, -0.025), W["subfloor"])

box("wall_back", X1 - X0 + 0.2, 0.15, H, ((X0 + X1) / 2, Y1 + 0.075, H / 2), W["wall"])
box("wall_left", 0.15, Y1 - Y0 + 0.15, H, (X0 - 0.075, (Y0 + Y1) / 2, H / 2), W["wall_side"])
box("skirting_back", X1 - X0, 0.02, 0.09, ((X0 + X1) / 2, Y1 - 0.01, 0.045), W["trim"], bevel=0.003)
box("skirting_left", 0.02, Y1 - Y0, 0.09, (X0 + 0.01, (Y0 + Y1) / 2, 0.045), W["trim"], bevel=0.003)

# rug with pool-lane lines
RUG = (-0.15, 1.75, 3.0, 2.0)
box("rug", RUG[2], RUG[3], 0.012, (RUG[0], RUG[1], 0.006), W["rug"], bevel=0.004)
for i in range(1, 5):
    yy = RUG[1] - RUG[3] / 2 + i * RUG[3] / 5
    box(f"rug_lane{i}", RUG[2] - 0.5, 0.035, 0.002, (RUG[0], yy, 0.0125), W["rug_line"])
    for s in (-1, 1):
        box(f"rug_t{i}{s}", 0.035, 0.14, 0.002, (RUG[0] + s * (RUG[2] / 2 - 0.25), yy, 0.0125), W["rug_line"])
box("rug_border_a", RUG[2] - 0.12, 0.02, 0.002, (RUG[0], RUG[1] - RUG[3] / 2 + 0.06, 0.0125), W["rug_line_light"])
box("rug_border_b", RUG[2] - 0.12, 0.02, 0.002, (RUG[0], RUG[1] + RUG[3] / 2 - 0.06, 0.0125), W["rug_line_light"])

# window on the left wall (night city is painted in the browser on tex_sky)
with grp("window", (X0 + 0.005, 1.25, 1.62)):
    plane("tex_sky", 1.2, 1.45, (0.01, 0, 0), mat("sky", "#000000", 1.0, emit="#ffffff", strength=1.0), rot=(math.pi / 2, 0, -math.pi / 2))
    fm = mat("window_frame", "#18191b", 0.4, 0.3)
    for dz in (-0.76, 0.76):
        box(f"win_h{dz}", 0.08, 1.34, 0.07, (0.04, 0, dz), fm, bevel=0.008)
    for dy in (-0.635, 0.635):
        box(f"win_v{dy}", 0.08, 0.07, 1.59, (0.04, dy, 0), fm, bevel=0.008)
    box("win_mullion", 0.05, 0.035, 1.5, (0.04, 0, 0), fm, bevel=0.005)
    box("win_transom", 0.05, 1.25, 0.035, (0.04, 0, 0.2), fm, bevel=0.005)
    box("win_sill", 0.2, 1.45, 0.04, (0.09, 0, -0.81), W["walnut_dark"], bevel=0.006)

# ---------------------------------------------------------------------------
# Desk wall: slatted acoustic panel with LED behind the monitor
# ---------------------------------------------------------------------------
DESK = dict(x=-0.25, y=2.58, w=2.3, d=0.8, top=0.76)
with grp("slat_wall", (DESK["x"], Y1 - 0.012, 0)):
    box("slat_felt", 2.5, 0.012, 1.85, (0, 0, 0.66 + 1.85 / 2), W["felt"])
    sw, n = 0.028, 40
    bm = bmesh.new(); _uv(bm)
    for i in range(n):
        xx = -1.25 + 0.03 + i * (2.44 / (n - 1))
        bm_box(bm, sw, 0.022, 1.85, (xx, -0.017, 0.66 + 1.85 / 2))
    _link("slats", bm, W["walnut"], bevel=0.003, bevel_seg=2)

# ---------------------------------------------------------------------------
# Desk
# ---------------------------------------------------------------------------
with grp("desk", (DESK["x"], DESK["y"], 0)):
    w, d, t = DESK["w"], DESK["d"], DESK["top"]
    box("desk_top", w, d, 0.045, (0, 0, t - 0.0225), W["walnut"], bevel=0.006)
    for sx in (-1, 1):
        lx = sx * (w / 2 - 0.12)
        box(f"leg_{sx}", 0.06, d - 0.1, 0.035, (lx, 0, 0.0175), W["black_metal"], bevel=0.006)
        box(f"legtop_{sx}", 0.06, d - 0.1, 0.035, (lx, 0, t - 0.0625), W["black_metal"], bevel=0.006)
        box(f"legpost_{sx}", 0.06, 0.06, t - 0.08, (lx, 0, (t - 0.08) / 2 + 0.035 / 2), W["black_metal"], bevel=0.006)
    box("desk_beam", w - 0.3, 0.04, 0.05, (0, d / 2 - 0.12, t - 0.09), W["black_metal"], bevel=0.006)
    box("cable_tray", 1.2, 0.12, 0.06, (0.1, d / 2 - 0.15, t - 0.16), W["black_metal"], bevel=0.004)

def on_desk(x, y):
    return (DESK["x"] + x, DESK["y"] + y, DESK["top"])

# ---------------------------------------------------------------------------
# Monitor (curved ultrawide on an arm) + keyboard + mouse  → item: monitor
# ---------------------------------------------------------------------------
with item("monitor", on_desk(0.0, 0.0)):
    R, MW, MH = 1.6, 1.22, 0.52
    cz, cy = 0.43, 0.12   # screen centre height above desk, depth offset
    # curved screen: subdivided grid bent toward the viewer
    def curved(name, width, height, depth_off, material, segs=40):
        bm = bmesh.new(); uv = _uv(bm)
        verts = []
        for j in range(2):
            rowv = []
            for i in range(segs + 1):
                u = i / segs
                xx = (u - 0.5) * width
                yy = -(R - math.sqrt(R * R - xx * xx)) + depth_off
                rowv.append(bm.verts.new((xx, yy, (j - 0.5) * height)))
            verts.append(rowv)
        for i in range(segs):
            f = bm.faces.new((verts[0][i], verts[0][i + 1], verts[1][i + 1], verts[1][i]))
            for loop in f.loops:
                v = loop.vert
                loop[uv].uv = ((v.co.x / width) + 0.5, (v.co.z / height) + 0.5)
        bm.normal_update()
        return bm
    # face normal must look at -Y (viewer): faces above are built CCW seen from -Y
    bm = curved("tex_screen", MW - 0.03, MH - 0.03, -0.004, W["screen"])
    _link("tex_screen", bm, W["screen"], (0, cy, cz), smooth=True)
    # shell: front bezel + back
    bm = curved("monitor_bezel", MW, MH, 0.0, None)
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    ext = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    bmesh.ops.translate(bm, vec=(0, 0.03, 0), verts=[v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    _link("monitor_shell", bm, W["plastic_dark"], (0, cy, cz), bevel=0.006, bevel_seg=2)
    box("monitor_backhub", 0.16, 0.05, 0.16, (0, cy + 0.06, cz), W["plastic_dark"], bevel=0.02)
    # arm
    box("arm_clamp", 0.07, 0.09, 0.05, (0.0, 0.33, 0.025), W["black_metal"], bevel=0.006)
    cyl("arm_pole", 0.017, 0.017, 0.4, (0.0, 0.34, 0.25), W["black_metal"])
    tube("arm_upper", [(0.0, 0.34, 0.43), (0.0, 0.26, 0.43), (0.0, 0.19, cz)], 0.018, W["black_metal"])
    # LED bias strip on the back
    box("bias_led", 0.9, 0.006, 0.01, (0, cy + 0.04, cz + 0.2), W["led"])
    # desk mat
    box("desk_mat", 1.0, 0.38, 0.004, (0.0, -0.18, 0.002), W["felt"], bevel=0.002)
    # keyboard (75%): case + keycaps merged by colour
    kx, ky = -0.12, -0.17
    box("kb_case", 0.33, 0.13, 0.022, (kx, ky, 0.015), mat("kb_case", "#2a2c30", 0.35, 0.5), bevel=0.006)
    cap_a, cap_b, cap_c = bmesh.new(), bmesh.new(), bmesh.new()
    for b in (cap_a, cap_b, cap_c): _uv(b)
    pitch = 0.0195
    rows = [16, 15, 15, 14, 14, 10]
    for r, count in enumerate(rows):
        y = ky + 0.05 - r * pitch
        xcur = kx - 0.15
        widths = [1] * count
        if r == 5:
            widths = [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1, 1][:count]
        for i, wk in enumerate(widths):
            ww = wk * pitch
            target = cap_b if (r == 0 and i == 0) or (r == 3 and i == count - 1) else (cap_c if r == 5 or i == count - 1 else cap_a)
            if xcur + ww > kx + 0.16: break
            bm_box(target, ww - 0.003, pitch - 0.003, 0.009, (xcur + ww / 2, y, 0.03))
            xcur += ww
    _link("keycaps", cap_a, mat("keycap", "#b9b1a3", 0.55), bevel=0.0015, bevel_seg=2)
    _link("keycaps_accent", cap_b, mat("keycap_accent", "#d97757", 0.5), bevel=0.0015, bevel_seg=2)
    _link("keycaps_mod", cap_c, mat("keycap_mod", "#5d6066", 0.5), bevel=0.0015, bevel_seg=2)
    sphere("mouse", 0.032, (0.25, -0.17, 0.012), mat("mouse", "#1f2024", 0.35), scale=(0.9, 1.45, 0.42))

# ---------------------------------------------------------------------------
# Desk décor: laptop in vertical stand, headphones on stand, small plant
# ---------------------------------------------------------------------------
with item("dashboard", on_desk(-1.0, 0.08), rot_z=0.3):
    box("tab_stand", 0.16, 0.1, 0.01, (0, 0.01, 0.005), W["alu"], bevel=0.003)
    box("tab_support", 0.05, 0.012, 0.13, (0, 0.045, 0.07), W["alu"], bevel=0.003, rot=(-0.35, 0, 0))
    tilt = -0.3
    n = Vector((0, -math.cos(tilt), -math.sin(tilt)))  # screen normal after tilting back
    c = Vector((0, 0.015, 0.105))
    box("tab_body", 0.27, 0.008, 0.19, tuple(c), mat("tab_body", "#1c1d20", 0.3, 0.4), bevel=0.004, rot=(tilt, 0, 0))
    plane("tex_dashboard", 0.255, 0.175, tuple(c + n * 0.0047), mat("tab_screen", "#000000", 0.2, emit="#ffffff", strength=1.0), rot=(math.pi / 2 + tilt, 0, 0))
with grp("headphones", on_desk(-0.72, 0.16)):
    cyl("hp_base", 0.06, 0.065, 0.015, (0, 0, 0.0075), W["walnut_dark"], bevel=0.003)
    tube("hp_pole", [(0, 0, 0.01), (0.005, 0, 0.12), (-0.01, 0, 0.22), (0, 0, 0.27)], 0.01, W["walnut"])
    tube("hp_band", arc_pts(0.08, 0.05, math.pi - 0.05, 24), 0.011, mat("hp", "#23252a", 0.4, 0.3), loc=(0, 0, 0.2))
    for s in (-1, 1):
        cyl(f"hp_cup{s}", 0.042, 0.042, 0.035, (s * 0.085, 0, 0.19), mat("hp_cup", "#2f3237", 0.6), rot=(0, math.pi / 2, 0), bevel=0.008)
with grp("desk_plant", on_desk(0.95, 0.25)):
    cyl("dp_pot", 0.05, 0.04, 0.08, (0, 0, 0.04), W["ceramic_white"], bevel=0.004)
    cyl("dp_soil", 0.045, 0.045, 0.005, (0, 0, 0.078), W["soil"])
    for i in range(9):
        a = i * 2.4
        leaf(f"dp_leaf{i}", random.uniform(0.07, 0.11), 0.018, W["leaf"], (math.cos(a) * 0.01, math.sin(a) * 0.01, 0.075),
             (random.uniform(-0.5, 0.5), random.uniform(-0.6, 0.6), a))

# desk microphone = lecture recorder → item: recorder
with item("recorder", on_desk(0.36, 0.16), rot_z=-0.2):
    dark = mat("mic_body", "#202226", 0.35, 0.6)
    for a in (0.3, 2.4, 4.5):
        tube(f"mic_leg{a}", [(0, 0, 0.055), (0.065 * math.cos(a), 0.065 * math.sin(a), 0.004)], 0.004, dark, ring=6)
    cyl("mic_mount", 0.008, 0.008, 0.04, (0, 0, 0.07), dark, seg=12)
    cyl("mic_body", 0.022, 0.02, 0.1, (0, 0, 0.13), dark, bevel=0.003)
    cyl("mic_band", 0.0235, 0.0235, 0.008, (0, 0, 0.183), W["brass"])
    sphere("mic_grille", 0.026, (0, 0, 0.205), mat("mic_grille", "#9a9da3", 0.45, 0.85), seg=24, scale=(1, 1, 1.25))
    sphere("mic_rec", 0.004, (0, -0.021, 0.14), mat("rec_led", "#ff3b30", 0.4, emit="#ff2a1f", strength=8), seg=10)

# planner "Moje sprawy" → item: priorytet
with item("priorytet", on_desk(-0.72, -0.2), rot_z=0.15):
    box("planner", 0.22, 0.29, 0.024, (0, 0, 0.012), W["purple"], bevel=0.004)
    box("planner_pages", 0.212, 0.282, 0.018, (0.006, 0, 0.012), W["paper"])
    box("planner_band", 0.014, 0.292, 0.026, (0.08, 0, 0.012), W["gold"], bevel=0.002)
    plane("tex_planner", 0.2, 0.27, (-0.008, 0, 0.0245), mat("planner_cover", "#2a1548", 0.6), rot=(0, 0, 0))
    for i, (dx, dy, rz, col) in enumerate([(0.17, 0.06, 0.2, "#ffe48a"), (0.18, -0.06, -0.15, "#c9b4ff")]):
        box(f"sticky{i}", 0.07, 0.07, 0.002, (dx, dy, 0.001), mat(f"sticky{i}", col, 0.9), rot=(0, 0, rz))
        plane(f"tex_sticky{i}", 0.066, 0.066, (dx, dy, 0.0023), mat(f"sticky_top{i}", col, 0.9), rot=(0, 0, rz))
    cyl("pen", 0.005, 0.005, 0.15, (0.0, -0.05, 0.03), W["gold"], seg=12, rot=(0, math.pi / 2, 0.4))

# magnifier → item: magnifier
with item("magnifier", on_desk(-1.0, -0.25), rot_z=-0.6):
    tube("mag_ring", arc_pts(0.05, 0, 2 * math.pi, 40, "xy")[:-1], 0.007, W["brass"], closed=True, loc=(0, 0, 0.009))
    cyl("mag_lens", 0.048, 0.048, 0.004, (0, 0, 0.009), W["glass"], seg=40)
    cyl("mag_handle", 0.01, 0.012, 0.11, (0.11, 0, 0.011), W["walnut_dark"], seg=16, rot=(0, math.pi / 2, 0))

# document tray with case files + stamp → item: inkaso (opens the "Inkaso w pigułce" demo)
with item("inkaso", on_desk(0.64, 0.04), rot_z=-0.12):
    tray = mat("tray", "#1f2124", 0.4, 0.6)
    box("tray_base", 0.24, 0.31, 0.008, (0, 0, 0.004), tray, bevel=0.002)
    for sx in (-1, 1):
        box(f"tray_side{sx}", 0.006, 0.31, 0.035, (sx * 0.117, 0, 0.0175), tray, bevel=0.002)
    box("tray_back", 0.24, 0.006, 0.035, (0, 0.152, 0.0175), tray, bevel=0.002)
    for k in range(6):
        box(f"sheet{k}", 0.21, 0.297, 0.0012, (random.uniform(-0.004, 0.004), random.uniform(-0.004, 0.004), 0.009 + k * 0.0016),
            W["paper"], rot=(0, 0, random.uniform(-0.03, 0.03)))
    plane("tex_invoice", 0.21, 0.297, (0, 0, 0.0185), mat("invoice", "#f4efe4", 0.9), rot=(0, 0, 0.01))
    # rubber stamp next to the tray
    box("stamp_base", 0.06, 0.035, 0.018, (0.17, -0.09, 0.009), mat("stamp_base", "#2b2d31", 0.5), bevel=0.004)
    box("stamp_rubber", 0.056, 0.031, 0.004, (0.17, -0.09, 0.0015), mat("stamp_ink", "#1f7a4d", 0.8))
    cyl("stamp_neck", 0.008, 0.01, 0.04, (0.17, -0.09, 0.038), W["walnut_dark"], seg=14)
    sphere("stamp_knob", 0.02, (0.17, -0.09, 0.07), W["walnut"], seg=20, scale=(1, 1, 0.85))

# phone → item: phone
with item("phone", on_desk(0.72, -0.24), rot_z=-0.3):
    box("phone_body", 0.075, 0.155, 0.008, (0, 0, 0.004), mat("phone_body", "#1b1b1d", 0.3, 0.4), bevel=0.003)
    plane("tex_phone", 0.068, 0.146, (0, 0, 0.0085), mat("phone_screen", "#000000", 0.2, emit="#ffffff", strength=1.0), rot=(0, 0, 0))

# ---------------------------------------------------------------------------
# Chair (back toward the viewer) → item: chair
# ---------------------------------------------------------------------------
with item("chair", (1.0, 1.45, 0), rot_z=-0.55):
    fab = mat("chair_fabric", "#2b2e33", 0.95)
    for i in range(5):
        a = i / 5 * 2 * math.pi
        box(f"chair_leg{i}", 0.3, 0.045, 0.03, (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.075), W["black_metal"], bevel=0.008, rot=(0, 0, a))
        sphere(f"chair_wheel{i}", 0.028, (math.cos(a) * 0.29, math.sin(a) * 0.29, 0.03), W["plastic_dark"], seg=12)
    cyl("chair_gas", 0.025, 0.025, 0.35, (0, 0, 0.26), W["steel"])
    box("chair_seat", 0.52, 0.5, 0.09, (0, 0.02, 0.48), fab, bevel=0.035)
    box("chair_spine", 0.05, 0.04, 0.38, (0, -0.24, 0.66), W["black_metal"], bevel=0.008)
    box("chair_back", 0.5, 0.08, 0.6, (0, -0.28, 0.95), fab, bevel=0.035, rot=(-0.1, 0, 0))
    for s in (-1, 1):
        box(f"chair_armpost{s}", 0.035, 0.035, 0.2, (s * 0.27, 0.0, 0.6), W["black_metal"], bevel=0.006)
        box(f"chair_arm{s}", 0.07, 0.28, 0.03, (s * 0.27, 0.02, 0.71), W["plastic_dark"], bevel=0.012)

# ---------------------------------------------------------------------------
# Left part of the back wall: whiteboard + git poster
# ---------------------------------------------------------------------------
with item("whiteboard", (-2.3, Y1 - 0.02, 1.38)):
    box("wb_frame", 1.24, 0.025, 0.84, (0, 0, 0), W["alu"], bevel=0.006)
    plane("tex_whiteboard", 1.19, 0.79, (0, -0.0135, 0), mat("wb_surface", "#f7f7f3", 0.3))
    box("wb_tray", 0.7, 0.06, 0.02, (0, -0.03, -0.43), W["alu"], bevel=0.004)
    for i, col in enumerate(["#1e3a8a", "#b91c1c", "#15803d"]):
        cyl(f"marker{i}", 0.009, 0.009, 0.11, (-0.12 + i * 0.12, -0.035, -0.41), mat(f"mk{i}", col, 0.5), seg=10, rot=(0, math.pi / 2, 0))

with item("poster", (-2.5, Y1 - 0.02, 2.34)):
    box("poster_frame", 0.84, 0.025, 0.5, (0, 0, 0), mat("frame_black", "#111111", 0.5), bevel=0.005)
    plane("tex_poster", 0.78, 0.44, (0, -0.0135, 0), mat("poster_art", "#17222a", 0.8))

with item("automations", (-1.8, Y1 - 0.012, 2.3)):
    box("cal_back", 0.34, 0.008, 0.48, (0, 0, 0), W["paper"], bevel=0.002)
    plane("tex_calendar", 0.33, 0.47, (0, -0.0045, 0), mat("cal_face", "#f3ede2", 0.85))
    for i in range(7):
        tube(f"cal_ring{i}", arc_pts(0.009, 0, 2 * math.pi, 12, "xz")[:-1], 0.0015, W["steel"], closed=True, ring=5,
             loc=(-0.12 + i * 0.04, -0.006, 0.235), rot=(0, 0, math.pi / 2))
    sphere("cal_nail", 0.006, (0, -0.004, 0.27), W["steel"], seg=10)

# ---------------------------------------------------------------------------
# Floating shelves with LED strips (right side)
# ---------------------------------------------------------------------------
SH = dict(x=2.0, w=1.25, d=0.26, levels=[0.9, 1.37, 1.84, 2.31])
SHY = Y1 - SH["d"] / 2
for i, z in enumerate(SH["levels"]):
    box(f"shelf{i}", SH["w"], SH["d"], 0.04, (SH["x"], SHY, z - 0.02), W["walnut"], bevel=0.005)
    box(f"shelf_led{i}", SH["w"] - 0.1, 0.008, 0.006, (SH["x"], Y1 - 0.03, z - 0.043), W["led"])

def on_shelf(level, x, y=0.0):
    return (SH["x"] + x, SHY + y, SH["levels"][level])

# books → item: books (titles live in glTF extras, spines are painted in the browser)
BOOKS = [
    (0.05, 0.25, "#7a2e2e", "Ekonomia"), (0.04, 0.23, "#21424a", "Rachunkowość"), (0.06, 0.26, "#c9a14a", "Finanse"),
    (0.045, 0.22, "#3d5a3c", "Sprzedaż"), (0.055, 0.25, "#e7ddca", "Marketing"), (0.04, 0.21, "#5b3a6e", "Excel"),
    (0.05, 0.24, "#2f4f7f", "Procesy"),
]
with item("books", on_shelf(0, -0.5, -0.01)):
    xx = 0.0
    for i, (bw, bh, col, title) in enumerate(BOOKS):
        m = mat(f"book{i}", col, 0.7)
        box(f"book{i}", bw, 0.18, bh, (xx + bw / 2, 0, bh / 2), m, bevel=0.003)
        p = plane(f"tex_spine{i}", bw - 0.004, bh - 0.01, (xx + bw / 2, -0.0905, bh / 2), m)
        p["title"] = title
        p["bg"] = col
        xx += bw + 0.003
    box("book_lean", 0.045, 0.18, 0.23, (xx + 0.06, 0, 0.11), mat("book_lean", "#a9573a", 0.7), bevel=0.003, rot=(0, 0.33, 0))

# globe → item: globe
with item("globe", on_shelf(0, 0.38)):
    cyl("globe_base", 0.055, 0.065, 0.02, (0, 0, 0.01), W["walnut_dark"], bevel=0.003)
    cyl("globe_post", 0.007, 0.007, 0.07, (0, 0, 0.055), W["brass"], seg=10)
    with grp("globe_tilt", (0, 0, 0.19)) as gt:
        gt.rotation_euler = (0, 0.41, 0)
        sphere("anim_globe", 0.1, (0, 0, 0), mat("globe", "#2c6f78", 0.5), seg=48)
        tube("globe_arc", arc_pts(0.115, -math.pi / 2, math.pi / 2, 32), 0.005, W["brass"])

# spine model → item: anatomia
with item("anatomia", on_shelf(1, -0.38), rot_z=0.35):
    s = 0.85
    cyl("sp_base", 0.08, 0.09, 0.022, (0, 0, 0.011), W["walnut_dark"], bevel=0.004)
    cyl("sp_rod", 0.005, 0.005, 0.36 * s, (0, 0.035, 0.18 * s), W["steel"], seg=8)
    bm = bmesh.new(); _uv(bm)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.05, radius2=0.04, depth=0.04, calc_uvs=True)
    _link("sp_pelvis", bm, W["ivory"], (0, 0, 0.055), bevel=0.01)
    N = 13
    z = 0.08
    bm_v, bm_d = bmesh.new(), bmesh.new()
    _uv(bm_v); _uv(bm_d)
    for i in range(N):
        t = i / (N - 1)
        yoff = -0.016 * math.sin(t * math.pi * 2 - 0.4)
        r = 0.023 - t * 0.008
        res = bmesh.ops.create_cone(bm_v, cap_ends=True, segments=14, radius1=r * 1.05, radius2=r, depth=0.014, calc_uvs=True)
        bmesh.ops.translate(bm_v, vec=(0, yoff, z), verts=res["verts"])
        bm_box(bm_v, 0.007, 0.028, 0.009, (0, yoff + r + 0.01, z - 0.003))
        if i < N - 1:
            res = bmesh.ops.create_cone(bm_d, cap_ends=True, segments=14, radius1=r * 0.95, radius2=r * 0.95, depth=0.006, calc_uvs=True)
            bmesh.ops.translate(bm_d, vec=(0, yoff, z + 0.0095), verts=res["verts"])
        if 4 <= i <= 9:
            rr = 0.048 - abs(i - 6.5) * 0.004
            for sgn in (-1, 1):
                pts = [(sgn * rr * math.sin(a), yoff - rr * (1 - math.cos(a)) * 0.9 + 0.01, z - 0.012 - 0.02 * math.sin(a))
                       for a in [k / 10 * math.pi * 0.85 for k in range(11)]]
                tube(f"rib{i}{sgn}", pts, 0.0035, W["ivory"], ring=6)
        z += 0.0175
    _link("sp_vertebrae", bm_v, W["ivory"])
    _link("sp_discs", bm_d, W["disc"])
    sphere("sp_skull", 0.052, (0, -0.003, z + 0.04), W["ivory"], seg=28, scale=(0.9, 1.05, 1))
    box("sp_jaw", 0.06, 0.05, 0.026, (0, -0.025, z), W["ivory"], bevel=0.01)
    for sx in (-1, 1):
        sphere(f"sp_eye{sx}", 0.011, (sx * 0.018, -0.048, z + 0.045), mat("socket", "#3a3530", 0.9), seg=10)

# medal + goggles (decor)
with grp("swim_shelf", on_shelf(1, 0.32)):
    box("medal_stand", 0.08, 0.05, 0.012, (0, 0, 0.006), W["walnut_dark"], bevel=0.003)
    cyl("medal", 0.04, 0.04, 0.007, (0, 0, 0.055), W["gold"], seg=32, rot=(math.pi / 2 - 0.15, 0, 0))
    box("medal_ribbon", 0.028, 0.004, 0.08, (0, 0.01, 0.11), mat("ribbon", "#2f6fb0", 0.6), rot=(0.15, 0, 0))
    gm = mat("goggles", "#1f6fd1", 0.25, 0.2)
    for sx in (-1, 1):
        tube(f"gog{sx}", arc_pts(0.02, 0, 2 * math.pi, 20, "xy")[:-1], 0.005, gm, closed=True, loc=(0.12 + sx * 0.026, -0.02, 0.008))
        cyl(f"goglens{sx}", 0.018, 0.018, 0.003, (0.12 + sx * 0.026, -0.02, 0.008), mat("goglens", "#9ad7ff", 0.05, 0.6), seg=20)

# JARVIS robot → item: jarvis
with item("jarvis", on_shelf(2, -0.35), rot_z=0.3):
    shell = mat("robot_shell", "#e8e4dc", 0.3, 0.1)
    dark = mat("robot_dark", "#1d2228", 0.25, 0.4)
    cyl("rb_base", 0.075, 0.085, 0.028, (0, 0, 0.014), dark, bevel=0.004)
    cyl("rb_neck", 0.02, 0.028, 0.05, (0, 0, 0.05), dark)
    box("rb_torso", 0.15, 0.1, 0.1, (0, 0, 0.12), mat("tux", "#1b1d22", 0.5), bevel=0.035)
    box("rb_shirt", 0.045, 0.01, 0.075, (0, -0.05, 0.13), W["paper"], bevel=0.003)
    for sx in (-1, 1):
        bm = bmesh.new(); _uv(bm)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.014, radius2=0.0, depth=0.028, calc_uvs=True)
        _link(f"rb_tie{sx}", bm, mat("tie", "#8b1e2d", 0.5), (sx * 0.015, -0.055, 0.165), rot=(0, sx * math.pi / 2, 0), smooth=False)
    box("rb_head", 0.19, 0.14, 0.14, (0, 0, 0.255), shell, bevel=0.04)
    box("rb_visor", 0.16, 0.02, 0.06, (0, -0.066, 0.262), dark, bevel=0.012)
    for sx in (-1, 1):
        sphere(f"anim_eye_{'L' if sx < 0 else 'R'}", 0.012, (sx * 0.038, -0.077, 0.262), W["led_cool"], seg=14, scale=(1.3, 0.45, 1))
        cyl(f"rb_ear{sx}", 0.02, 0.02, 0.02, (sx * 0.1, 0, 0.255), dark, rot=(0, math.pi / 2, 0))
    cyl("rb_antenna", 0.003, 0.003, 0.06, (0, 0, 0.355), dark, seg=8)
    sphere("rb_antenna_tip", 0.012, (0, 0, 0.39), mat("antenna", "#ffd28a", 0.4, emit="#ffb347", strength=4), seg=12)

# small plant + stacked books + vase (decor)
with grp("shelf_plant", on_shelf(2, 0.36)):
    cyl("sp_pot", 0.06, 0.045, 0.09, (0, 0, 0.045), W["terracotta"], bevel=0.004)
    cyl("sp_soil2", 0.055, 0.055, 0.005, (0, 0, 0.088), W["soil"])
    for i in range(12):
        a = i * 2.39
        leaf(f"spl{i}", random.uniform(0.07, 0.1), 0.03, W["leaf"], (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.085),
             (random.uniform(0.4, 1.1), 0, a + math.pi / 2))
    for i in range(6):
        leaf(f"vine{i}", 0.04, 0.02, W["leaf_dark"], (0.04 + i * 0.008, -0.12 - i * 0.004, 0.06 - i * 0.05), (math.pi + 0.3, 0.3 * (-1) ** i, 0.4))
with item("instagram", on_shelf(3, -0.22)):
    dark = mat("tripod", "#1d1e21", 0.4, 0.5)
    for a in (0.6, 2.7, 4.8):
        tube(f"rl_leg{a}", [(0, 0, 0.07), (0.07 * math.cos(a), 0.07 * math.sin(a), 0.003)], 0.004, dark, ring=6)
    cyl("rl_pole", 0.006, 0.006, 0.1, (0, 0, 0.12), dark, seg=10)
    tube("rl_ring", arc_pts(0.085, 0, 2 * math.pi, 48)[:-1], 0.011, mat("ring_led", "#fff4e0", 0.4, emit="#ffe6c2", strength=5), closed=True, loc=(0, 0, 0.255))
    box("rl_holder", 0.012, 0.01, 0.09, (0, 0.006, 0.21), dark, bevel=0.003)
    box("rl_phone", 0.046, 0.007, 0.094, (0, 0, 0.255), mat("phone_body", "#1b1b1d", 0.3, 0.4), bevel=0.003)
    plane("tex_insta", 0.042, 0.088, (0, -0.0037, 0.255), mat("insta_screen", "#000000", 0.2, emit="#ffffff", strength=1.0))
with grp("vase", on_shelf(3, 0.3)):
    bm = bmesh.new(); _uv(bm)
    prof = [(0.0, 0), (0.045, 0), (0.06, 0.05), (0.05, 0.12), (0.025, 0.17), (0.028, 0.2)]
    segs = 28
    rings = []
    for (r, zz) in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), zz)) for k in range(segs)])
    for j in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[j][k], rings[j][(k + 1) % segs], rings[j + 1][(k + 1) % segs], rings[j + 1][k]))
    _link("vase", bm, mat("vase", "#c9b79c", 0.35), sharp_angle=80)
    for i in range(3):
        tube(f"twig{i}", [(0, 0, 0.18), (0.02 * (i - 1), 0.01, 0.3), (0.05 * (i - 1), 0.0, 0.42)], 0.003, W["walnut_dark"], ring=6)

# kickboard leaning on the wall → item: swim
with item("swim", (-1.85, Y1 - 0.12, 0.0), rot_z=0.25):
    box("kickboard", 0.3, 0.035, 0.46, (0, 0, 0.23), mat("kickboard", "#2a7fd4", 0.55), bevel=0.06, rot=(-0.22, 0, 0))
    box("kick_stripe", 0.2, 0.045, 0.1, (0, 0.0, 0.332), mat("kick_stripe", "#ffd23f", 0.55), bevel=0.02, rot=(-0.22, 0, 0))
with grp("whistle", (-2.25, Y1 - 0.3, 0)):
    cyl("whistle", 0.014, 0.014, 0.045, (0, 0, 0.014), mat("whistle", "#e23b3b", 0.4), seg=16, rot=(0, math.pi / 2, 0))
    tube("lanyard", [(0.09 * math.cos(a) - 0.1, 0.05 * math.sin(a), 0.004) for a in [k / 24 * 2 * math.pi for k in range(24)]],
         0.004, mat("lanyard", "#1f6fd1", 0.8), closed=True, ring=6)

# monstera → item: plant
with item("plant", (2.05, 2.68, 0)):
    cyl("pl_pot", 0.17, 0.13, 0.34, (0, 0, 0.17), W["ceramic_white"], bevel=0.008)
    cyl("pl_soil", 0.155, 0.155, 0.01, (0, 0, 0.335), W["soil"])
    for i in range(11):
        a = i * 2.39996
        hgt = 0.18 + (i % 4) * 0.07 + random.random() * 0.05
        lean = 0.14 + (i % 3) * 0.08
        base = 0.34
        tip = Vector((math.cos(a) * lean, math.sin(a) * lean * 0.6, base + hgt))
        pts = []
        for k in range(9):
            t = k / 8
            p = Vector((0, 0, base)) * (1 - t) ** 2 + Vector((tip.x * 0.3, tip.y * 0.3, base + hgt * 0.8)) * 2 * (1 - t) * t + tip * t * t
            pts.append(p)
        tube(f"pl_stem{i}", pts, 0.006, W["stem"], ring=6)
        leaf(f"pl_leaf{i}", random.uniform(0.2, 0.26), 0.13, W["leaf"] if i % 2 else W["leaf_dark"], tuple(tip),
             (random.uniform(1.0, 1.5), 0, a - math.pi / 2))

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", export_apply=True, export_yup=True,
    export_extras=True, export_lights=False, export_cameras=False,
    export_texcoords=True, export_normals=True, export_materials="EXPORT",
)
print("EXPORTED", OUT, os.path.getsize(OUT) // 1024, "KB")

# ---------------------------------------------------------------------------
# Optional Cycles preview (same framing as the browser camera)
# ---------------------------------------------------------------------------
if "--render" in ARGS:
    sc = bpy.context.scene
    cam_data = bpy.data.cameras.new("cam"); cam_data.lens_unit = "FOV"; cam_data.angle = math.radians(72)
    cam = bpy.data.objects.new("cam", cam_data); COLL.objects.link(cam)
    cam.location = (0.25, -1.3, 1.6)
    direction = Vector((0.1, 2.6, 1.2)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    def light(kind, loc, energy, color, size=0.1, rot=None):
        ld = bpy.data.lights.new(kind + str(loc), kind); ld.energy = energy; ld.color = lin(color)
        if hasattr(ld, "shadow_soft_size"): ld.shadow_soft_size = size
        o = bpy.data.objects.new(ld.name, ld); COLL.objects.link(o); o.location = loc
        if rot: o.rotation_euler = rot
    light("AREA", (DESK["x"], DESK["y"] - 0.35, DESK["top"] + 0.45), 25, "#a8c4ff", 0.6, rot=(math.radians(-80), 0, 0))
    light("POINT", (DESK["x"], Y1 - 0.15, 1.45), 30, "#ff9a4a", 0.4)
    for z in SH["levels"]:
        light("POINT", (SH["x"], Y1 - 0.08, z - 0.08), 6, "#ffb45e", 0.3)
    light("AREA", (X0 + 0.3, 1.25, 1.6), 60, "#9db8ff", 1.0, rot=(0, math.radians(-90), 0))
    light("SPOT", (0.2, 1.8, 2.95), 120, "#ffd6a0", 0.3)
    world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.025, 0.04, 1)
    sc.render.engine = "CYCLES"; sc.cycles.samples = 48; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.render.filepath = os.path.join(HERE, "preview.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", sc.render.filepath)
