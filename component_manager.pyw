"""
IK Electro — Component Manager v3.1
===================================
- Auto-save on every add/edit/delete (with backups)
- Compact dialog (620×600) + collapsed "More options"
- Run with pythonw / .vbs to hide the console

Install:
    pip install customtkinter tkinterdnd2 pillow
"""

import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

import customtkinter as ctk
from PIL import Image

try:
    from tkinterdnd2 import DND_FILES
    DND_AVAILABLE = True
except Exception:
    DND_AVAILABLE = False
    DND_FILES = None

# ============================================================
# CONFIG
# ============================================================
SCRIPT_DIR = Path(__file__).parent
COMPONENTS_JS = SCRIPT_DIR / "components.js"
IMAGES_DIR = SCRIPT_DIR / "Images"
BACKUP_DIR = SCRIPT_DIR / ".backups"
THUMB_CACHE = {}

CONDITIONS = {
    "A": "A — New",
    "B": "B — Used (100% working)",
    "C": "C — Has Problem",
    "D": "D — Mixed Components",
}

CATEGORIES = [
    "sensors", "switches", "modules", "LEDs", "ICs", "motors",
    "displays", "connectors", "power", "microcontrollers",
    "drivers", "audio", "locks", "Other"
]

COL_BG = "#0f1020"
COL_BG2 = "#1a1b34"
COL_BG3 = "#24244a"
COL_BG4 = "#2e2e5a"
COL_FG = "#f0e6d2"
COL_FG2 = "#b8b0c8"
COL_FG3 = "#6a6a88"
COL_ACCENT = "#e8b87a"
COL_ACCENT_HOVER = "#ffb347"
COL_DANGER = "#ef4444"
COL_SUCCESS = "#22c55e"
COL_WARN = "#f59e0b"

# ============================================================
# FAST SCROLL HELPER
# ============================================================
class FastScroll:
    """
    Makes a CTkScrollableFrame scroll faster with the mouse wheel.
    Usage:
        FastScroll(container, scrollable_frame, multiplier=8)
    """
    def __init__(self, container, scrollable_frame, multiplier=8):
        self.container = container
        self.scrollable = scrollable_frame
        self.multiplier = multiplier
        self._canvas = self._find_canvas(scrollable_frame)
        if not self._canvas:
            return

        # Bind on the whole toplevel — captures scroll anywhere inside the frame
        target = container.winfo_toplevel()
        target.bind_all("<MouseWheel>", self._on_wheel, add="+")      # Windows/macOS
        target.bind_all("<Button-4>", self._on_wheel_linux, add="+")  # Linux up
        target.bind_all("<Button-5>", self._on_wheel_linux, add="+")  # Linux down

    @staticmethod
    def _find_canvas(widget):
        """CTkScrollableFrame stores its canvas in _parent_canvas (or similar)."""
        for attr in ("_parent_canvas", "_canvas", "canvas"):
            c = getattr(widget, attr, None)
            if c is not None and hasattr(c, "yview_scroll"):
                return c
        # Fallback: walk children
        for child in widget.winfo_children():
            if child.winfo_class() == "Canvas":
                return child
        return None

    def _is_mouse_over(self):
        """Only scroll if the cursor is over our container."""
        try:
            x, y = self.container.winfo_pointerxy()
            widget_under = self.container.winfo_containing(x, y)
            if widget_under is None:
                return False
            # Walk up the parent chain
            w = widget_under
            while w is not None:
                if w == self.container:
                    return True
                try:
                    w = w.master
                except Exception:
                    break
            return False
        except Exception:
            return True  # if we can't tell, just scroll

    def _on_wheel(self, event):
        if not self._is_mouse_over():
            return
        try:
            delta = -1 if event.delta > 0 else 1
            self._canvas.yview_scroll(delta * self.multiplier, "units")
        except Exception:
            pass
        return "break"

    def _on_wheel_linux(self, event):
        if not self._is_mouse_over():
            return
        try:
            delta = -1 if event.num == 4 else 1
            self._canvas.yview_scroll(delta * self.multiplier, "units")
        except Exception:
            pass
        return "break"

# ============================================================
# PARSER / WRITER
# ============================================================
def parse_components_js(path):
    if not path.exists(): return []
    text = path.read_text(encoding="utf-8")
    match = re.search(r"const\s+components\s*=\s*\[(.*)\]\s*;?\s*$", text, re.DOTALL)
    if not match: return []
    body = match.group(1)
    objects, depth, current, in_string, string_char, escape = [], 0, "", False, "", False
    for ch in body:
        if escape: current += ch; escape = False; continue
        if ch == "\\": current += ch; escape = True; continue
        if in_string:
            current += ch
            if ch == string_char: in_string = False
            continue
        if ch in ('"', "'"):
            in_string = True; string_char = ch; current += ch; continue
        if ch == "{": depth += 1
        if depth > 0: current += ch
        if ch == "}":
            depth -= 1
            if depth == 0 and current.strip():
                objects.append(current.strip()); current = ""
    return [parse_js_object(o) for o in objects if o]


def parse_js_object(text):
    inner = text.strip()
    if inner.startswith("{"): inner = inner[1:]
    if inner.endswith("}"): inner = inner[:-1]
    result, i, n = {}, 0, len(inner)
    while i < n:
        while i < n and inner[i] in " \t\n\r,": i += 1
        if i >= n: break
        key_match = re.match(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:', inner[i:])
        if not key_match: i += 1; continue
        key = key_match.group(1); i += key_match.end()
        while i < n and inner[i] in " \t\n\r": i += 1
        value, i = read_js_value(inner, i)
        result[key] = value
    return result


def read_js_value(text, i):
    n = len(text)
    while i < n and text[i] in " \t\n\r": i += 1
    if i >= n: return None, i
    ch = text[i]
    if ch in ('"', "'"):
        quote = ch; i += 1; buf = ""
        while i < n:
            if text[i] == "\\" and i + 1 < n:
                buf += text[i + 1]; i += 2; continue
            if text[i] == quote:
                i += 1; break
            buf += text[i]; i += 1
        return buf, i
    if ch == "[":
        i += 1; items = []
        while i < n:
            while i < n and text[i] in " \t\n\r,": i += 1
            if i < n and text[i] == "]": i += 1; break
            if i >= n: break
            val, i = read_js_value(text, i)
            items.append(val)
        return items, i
    if ch == "{":
        depth = 1; i += 1; start = i
        in_string = False; string_char = ""; escape = False
        while i < n and depth > 0:
            c = text[i]
            if escape: escape = False
            elif c == "\\": escape = True
            elif in_string:
                if c == string_char: in_string = False
            elif c in ('"', "'"): in_string = True; string_char = c
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    inner = text[start:i]; i += 1
                    return parse_js_object("{" + inner + "}"), i
            i += 1
        return {}, i
    num_match = re.match(r"-?\d+(\.\d+)?", text[i:])
    if num_match:
        num_str = num_match.group(0); i += num_match.end()
        return float(num_str) if "." in num_str else int(num_str), i
    if text.startswith("true", i): return True, i + 4
    if text.startswith("false", i): return False, i + 5
    if text.startswith("null", i): return None, i + 4
    start = i
    while i < n and text[i] not in ",}]": i += 1
    return text[start:i].strip(), i


def js_escape(s):
    if s is None: return ""
    return (str(s).replace("\\", "\\\\").replace('"', '\\"')
            .replace("\n", "\\n").replace("\r", "\\r"))


def js_value(v, indent=0):
    pad = "  " * indent
    if isinstance(v, bool): return "true" if v else "false"
    if v is None: return "null"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, str): return f'"{js_escape(v)}"'
    if isinstance(v, list):
        if not v: return "[]"
        if all(isinstance(x, str) and len(x) < 40 for x in v):
            return "[" + ", ".join(f'"{js_escape(x)}"' for x in v) + "]"
        return "[" + ", ".join(js_value(x, indent + 1) for x in v) + "]"
    if isinstance(v, dict):
        if not v: return "{}"
        parts = [f'{pad}    "{js_escape(k)}": {js_value(val, indent + 1)}'
                 for k, val in v.items()]
        return "{\n" + ",\n".join(parts) + f"\n{pad}  }}"
    return f'"{js_escape(v)}"'


def component_to_js(c):
    fields = ["id", "name", "short", "price", "currency",
              "condition", "stock", "category", "tags", "image"]
    lines = []
    for f in fields:
        if f in c: lines.append(f'    {f}: {js_value(c[f])}')
    if c.get("datasheets"):
        lines.append(f'    datasheets: {js_value(c["datasheets"])}')
    if c.get("specs"):
        lines.append(f'    specs: {js_value(c["specs"], 1)}')
    if c.get("compatibility"):
        lines.append(f'    compatibility: {js_value(c["compatibility"])}')
    return "  {\n" + ",\n".join(lines) + "\n  }"


def write_components_js(components, path, reason=""):
    """Write components.js. Always backs up the previous file first."""
    if path.exists():
        BACKUP_DIR.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        tag = f"_{reason}" if reason else ""
        backup_path = BACKUP_DIR / f"components_{ts}{tag}.js"
        n = 1
        while backup_path.exists():
            backup_path = BACKUP_DIR / f"components_{ts}{tag}_{n}.js"
            n += 1
        shutil.copy2(path, backup_path)

    parts = [component_to_js(c) for c in components]
    body = ",\n".join(parts)
    content = f"const components = [\n{body}\n];\n"
    path.write_text(content, encoding="utf-8")

    # Prune old backups — keep only the last 30
    try:
        backups = sorted(BACKUP_DIR.glob("components_*.js"))
        for old in backups[:-30]:
            old.unlink()
    except Exception:
        pass


# ============================================================
# IMAGE HELPERS
# ============================================================
def get_thumbnail(image_name, size=(44, 44)):
    if not image_name: return None
    path = IMAGES_DIR / image_name
    if not path.exists(): return None
    key = (str(path), size)
    if key in THUMB_CACHE: return THUMB_CACHE[key]
    try:
        img = Image.open(path).convert("RGBA")
        img.thumbnail(size, Image.LANCZOS)
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        x = (size[0] - img.width) // 2
        y = (size[1] - img.height) // 2
        canvas.paste(img, (x, y), img)
        ctk_img = ctk.CTkImage(light_image=canvas, dark_image=canvas, size=size)
        THUMB_CACHE[key] = ctk_img
        return ctk_img
    except Exception:
        return None


def import_image_to_folder(src_path):
    src = Path(src_path)
    IMAGES_DIR.mkdir(exist_ok=True)
    dest = IMAGES_DIR / src.name
    if src.resolve() != dest.resolve():
        if dest.exists():
            stem, suffix = dest.stem, dest.suffix
            n = 1
            while dest.exists():
                dest = IMAGES_DIR / f"{stem}_{n}{suffix}"
                n += 1
        shutil.copy2(src, dest)
    return dest.name


# ============================================================
# SPECS EDITOR
# ============================================================
class SpecsEditor(ctk.CTkFrame):
    def __init__(self, parent, specs_dict=None, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.rows = []

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 4))
        ctk.CTkLabel(header, text="Title", width=140, anchor="w",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color=COL_FG3).pack(side="left", padx=(0, 6))
        ctk.CTkLabel(header, text="Value", anchor="w",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color=COL_FG3).pack(side="left")

        self.rows_container = ctk.CTkFrame(self, fg_color="transparent")
        self.rows_container.pack(fill="x")

        if specs_dict:
            for k, v in specs_dict.items():
                self._add_row(k, v)

        ctk.CTkButton(
            self, text="+  Add specification", height=30,
            fg_color=COL_BG3, hover_color=COL_BG4,
            text_color=COL_ACCENT, font=ctk.CTkFont(size=12, weight="bold"),
            command=lambda: self._add_row("", ""),
        ).pack(fill="x", pady=(6, 0))

    def _add_row(self, key_text="", val_text=""):
        row = ctk.CTkFrame(self.rows_container, fg_color="transparent")
        row.pack(fill="x", pady=2)

        key_var = tk.StringVar(value=key_text)
        val_var = tk.StringVar(value=val_text)

        key_entry = ctk.CTkEntry(row, textvariable=key_var, width=140, height=30,
                                 fg_color=COL_BG2, text_color=COL_FG,
                                 border_color=COL_BG3,
                                 placeholder_text="e.g. Voltage")
        key_entry.pack(side="left", padx=(0, 6))

        val_entry = ctk.CTkEntry(row, textvariable=val_var, height=30,
                                 fg_color=COL_BG2, text_color=COL_FG,
                                 border_color=COL_BG3,
                                 placeholder_text="e.g. 5V DC")
        val_entry.pack(side="left", fill="x", expand=True, padx=(0, 6))

        del_btn = ctk.CTkButton(row, text="×", width=30, height=30,
                                fg_color=COL_BG3, hover_color="#5a2020",
                                text_color="#ff9999",
                                font=ctk.CTkFont(size=16, weight="bold"),
                                command=lambda r=row: self._remove_row(r))
        del_btn.pack(side="left")

        entry = {"frame": row, "key_var": key_var, "val_var": val_var}
        self.rows.append(entry)
        key_entry.focus_set()

    def _remove_row(self, row_widget):
        self.rows = [r for r in self.rows if r["frame"] != row_widget]
        row_widget.destroy()

    def get_specs(self):
        result = {}
        for r in self.rows:
            k = r["key_var"].get().strip()
            v = r["val_var"].get().strip()
            if k:
                result[k] = v
        return result


# ============================================================
# LIST EDITOR
# ============================================================
class ListEditor(ctk.CTkFrame):
    def __init__(self, parent, items=None, placeholder="", as_lines=False, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.as_lines = as_lines

        if as_lines:
            self.text = ctk.CTkTextbox(
                self, height=72, fg_color=COL_BG2,
                text_color=COL_FG, border_color=COL_BG3, border_width=1,
                font=ctk.CTkFont(size=12),
            )
            self.text.pack(fill="x")
            if items:
                self.text.insert("1.0", "\n".join(items))
        else:
            self.var = tk.StringVar(value=", ".join(items or []))
            ctk.CTkEntry(
                self, textvariable=self.var, height=32,
                fg_color=COL_BG2, text_color=COL_FG,
                border_color=COL_BG3, placeholder_text=placeholder,
            ).pack(fill="x")

    def get_list(self):
        if self.as_lines:
            return [l.strip() for l in self.text.get("1.0", "end").splitlines() if l.strip()]
        return [x.strip() for x in self.var.get().split(",") if x.strip()]


# ============================================================
# MAIN WINDOW
# ============================================================
class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("dark-blue")

        self.title("IK Electro — Component Manager")
        self.geometry("1180x720")
        self.minsize(900, 560)
        self.configure(fg_color=COL_BG)

        self.components = []
        self.filtered_indices = []
        self.selected_index = None
        self.row_widgets = []

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        self._build_topbar()
        self._build_searchbar()
        self._build_table()
        self._build_bottombar()

        self._enable_global_dnd()
        self._load_initial()

    def _enable_global_dnd(self):
        if not DND_AVAILABLE: return
        try:
            self.drop_target_register(DND_FILES)
        except Exception:
            pass

    def _build_topbar(self):
        top = ctk.CTkFrame(self, fg_color=COL_BG, corner_radius=0)
        top.grid(row=0, column=0, sticky="ew", padx=18, pady=(14, 0))

        ctk.CTkLabel(
            top, text="🪐  IK Electro",
            font=ctk.CTkFont(family="Segoe UI", size=19, weight="bold"),
            text_color=COL_ACCENT,
        ).pack(side="left")

        ctk.CTkLabel(
            top, text="Component Manager",
            font=ctk.CTkFont(size=12), text_color=COL_FG3,
        ).pack(side="left", padx=(10, 0))

        ctk.CTkButton(top, text="➕  Add", width=100, height=32,
                      fg_color=COL_ACCENT, hover_color=COL_ACCENT_HOVER,
                      text_color="#1a1a2e",
                      font=ctk.CTkFont(size=12, weight="bold"),
                      command=self.on_add).pack(side="right", padx=3)

        ctk.CTkButton(top, text="📤  Export copy", width=130, height=32,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG,
                      font=ctk.CTkFont(size=12, weight="bold"),
                      command=self.on_export).pack(side="right", padx=3)

        ctk.CTkButton(top, text="📥  Import", width=100, height=32,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG,
                      font=ctk.CTkFont(size=12),
                      command=self.on_import).pack(side="right", padx=3)

    def _build_searchbar(self):
        bar = ctk.CTkFrame(self, fg_color=COL_BG, corner_radius=0)
        bar.grid(row=1, column=0, sticky="ew", padx=18, pady=(10, 0))

        ctk.CTkLabel(bar, text="🔍", font=ctk.CTkFont(size=14),
                     text_color=COL_FG2).pack(side="left", padx=(0, 4))

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *a: self.refresh_table())
        ctk.CTkEntry(bar, textvariable=self.search_var, width=320, height=30,
                     placeholder_text="Search name, tag, ID…",
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3, font=ctk.CTkFont(size=12)).pack(
            side="left", padx=4)

        self.stats_label = ctk.CTkLabel(bar, text="0 components",
                                        font=ctk.CTkFont(size=11),
                                        text_color=COL_FG3)
        self.stats_label.pack(side="right", padx=4)

    def _build_table(self):
        wrap = ctk.CTkFrame(self, fg_color=COL_BG2, corner_radius=10)
        wrap.grid(row=2, column=0, sticky="nsew", padx=18, pady=12)
        wrap.grid_columnconfigure(0, weight=1)
        wrap.grid_rowconfigure(1, weight=1)

        header = ctk.CTkFrame(wrap, fg_color=COL_BG3, corner_radius=0, height=36)
        header.grid(row=0, column=0, sticky="ew", padx=1, pady=(1, 0))
        header.grid_propagate(False)

        cols = [
            ("",          52),
            ("ID",        95),
            ("Name",      170),
            ("Description", 260),
            ("Category",  110),
            ("Cond",      60),
            ("Stock",     60),
            ("Price",     90),
        ]
        for i, (label, width) in enumerate(cols):
            ctk.CTkLabel(header, text=label, width=width, anchor="w",
                         font=ctk.CTkFont(size=11, weight="bold"),
                         text_color=COL_ACCENT).grid(
                row=0, column=i, padx=4, pady=8, sticky="w")
            header.grid_columnconfigure(i, minsize=width)

        self.rows_frame = ctk.CTkScrollableFrame(wrap, fg_color="transparent")
        self.rows_frame.grid(row=1, column=0, sticky="nsew", padx=1, pady=1)
        self.rows_frame.grid_columnconfigure(0, weight=1)

        # ⚡ Fast mouse-wheel scrolling
        FastScroll(self.rows_frame, self.rows_frame, multiplier=40)

    def _build_bottombar(self):
        bar = ctk.CTkFrame(self, fg_color=COL_BG, corner_radius=0)
        bar.grid(row=3, column=0, sticky="ew", padx=18, pady=(0, 14))

        ctk.CTkButton(bar, text="✏️  Edit", width=90, height=30,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG, font=ctk.CTkFont(size=12),
                      command=self.on_edit).pack(side="left", padx=3)

        ctk.CTkButton(bar, text="🗑️  Delete", width=90, height=30,
                      fg_color="#2a1218", hover_color="#3a1a22",
                      text_color="#ff9999", font=ctk.CTkFont(size=12),
                      command=self.on_delete).pack(side="left", padx=3)

        ctk.CTkButton(bar, text="📂  Images folder", width=140, height=30,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG, font=ctk.CTkFont(size=12),
                      command=self.on_open_images).pack(side="left", padx=3)

        tip = "Drag images onto the Add/Edit dialog" if DND_AVAILABLE else "Tip: use Browse to add images"
        ctk.CTkLabel(bar, text=tip, font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(side="right", padx=4)

    def _load_initial(self):
        if COMPONENTS_JS.exists():
            try:
                self.components = parse_components_js(COMPONENTS_JS)
                self.status(f"Loaded {len(self.components)} components")
            except Exception as e:
                messagebox.showerror("Import failed", str(e))
        else:
            self.status("No components.js — starting fresh")
        IMAGES_DIR.mkdir(exist_ok=True)
        self.refresh_table()

    def refresh_table(self):
        for w in self.row_widgets:
            try: w["frame"].destroy()
            except Exception: pass
        self.row_widgets = []
        self.selected_index = None

        q = self.search_var.get().strip().lower()
        self.filtered_indices = []
        for idx, c in enumerate(self.components):
            if q:
                hay = " ".join([
                    str(c.get("name", "")), str(c.get("short", "")),
                    str(c.get("category", "")), str(c.get("id", "")),
                    " ".join(c.get("tags", []) or []),
                ]).lower()
                if q not in hay: continue
            self.filtered_indices.append(idx)

        widths = [52, 95, 170, 260, 110, 60, 60, 90]

        for display_i, comp_idx in enumerate(self.filtered_indices):
            c = self.components[comp_idx]
            stock = c.get("stock", 0)

            if stock <= 0: row_bg = "#2a1218"
            elif stock <= 3: row_bg = "#2a2418"
            else: row_bg = COL_BG2 if display_i % 2 == 0 else "#161736"

            row = ctk.CTkFrame(self.rows_frame, fg_color=row_bg,
                               corner_radius=6, height=52)
            row.grid(row=display_i, column=0, sticky="ew", padx=3, pady=2)
            self.rows_frame.grid_columnconfigure(0, weight=1)

            widgets = [row]
            for i, w in enumerate(widths):
                row.grid_columnconfigure(i, minsize=w)

            thumb = get_thumbnail(c.get("image", ""), size=(40, 40))
            if thumb:
                lbl = ctk.CTkLabel(row, image=thumb, text="", width=52)
            else:
                lbl = ctk.CTkLabel(row, text="🖼️", width=52,
                                   font=ctk.CTkFont(size=18),
                                   text_color=COL_FG3)
            lbl.grid(row=0, column=0, padx=4, pady=6)
            widgets.append(lbl)

            cells = [
                (c.get("id", ""), "w", COL_FG3),
                (c.get("name", ""), "w", COL_FG),
                (c.get("short", "")[:60] + ("…" if len(c.get("short", "")) > 60 else ""), "w", COL_FG2),
                (c.get("category", ""), "w", COL_FG2),
                (c.get("condition", ""), "w", COL_FG),
                (str(stock), "w",
                 COL_SUCCESS if stock > 3 else (COL_WARN if stock > 0 else COL_DANGER)),
                (f'{c.get("price", 0)} {c.get("currency", "")}', "w", COL_ACCENT),
            ]
            for i, (text, anchor, color) in enumerate(cells, start=1):
                l = ctk.CTkLabel(row, text=text, anchor=anchor,
                                 text_color=color,
                                 font=ctk.CTkFont(size=11))
                l.grid(row=0, column=i, padx=4, pady=6, sticky="w")
                widgets.append(l)

            for widget in widgets:
                widget.bind("<Button-1>", lambda e, ci=comp_idx: self.select_row(ci))
                widget.bind("<Double-Button-1>",
                            lambda e, ci=comp_idx: self.edit_by_index(ci))
                try: widget.configure(cursor="hand2")
                except Exception: pass

            self.row_widgets.append({
                "widgets": widgets, "index": comp_idx,
                "frame": row, "display_i": display_i,
            })

        total = len(self.components)
        shown = len(self.filtered_indices)
        self.stats_label.configure(
            text=f"{shown} of {total} shown" if q else f"{total} components")

    def select_row(self, comp_idx):
        self.selected_index = comp_idx
        for entry in self.row_widgets:
            try:
                if entry["index"] == comp_idx:
                    entry["frame"].configure(fg_color=COL_BG4)
                else:
                    c = self.components[entry["index"]]
                    stock = c.get("stock", 0)
                    if stock <= 0: bg = "#2a1218"
                    elif stock <= 3: bg = "#2a2418"
                    else: bg = COL_BG2 if entry["display_i"] % 2 == 0 else "#161736"
                    entry["frame"].configure(fg_color=bg)
            except Exception:
                pass

    # --------------------------------------------------------
    # AUTO-SAVE — writes components.js on every change
    # --------------------------------------------------------
    def _autosave(self, reason=""):
        """Write components.js immediately. Called after every mutation."""
        try:
            write_components_js(self.components, COMPONENTS_JS, reason=reason)
            return True
        except Exception as e:
            messagebox.showerror("Auto-save failed", str(e))
            return False

    def on_add(self):
        dlg = ComponentDialog(self, None, self.components)
        self.wait_window(dlg)
        if dlg.result:
            self.components.append(dlg.result)
            if self._autosave(reason="add"):
                self.refresh_table()
                self.status(f"✅ Added & saved '{dlg.result.get('name', '?')}'")

    def on_edit(self):
        if self.selected_index is None:
            messagebox.showinfo("Edit", "Select a component first.")
            return
        self.edit_by_index(self.selected_index)

    def edit_by_index(self, idx):
        dlg = ComponentDialog(self, self.components[idx], self.components)
        self.wait_window(dlg)
        if dlg.result:
            self.components[idx] = dlg.result
            if self._autosave(reason="edit"):
                self.refresh_table()
                self.status(f"✅ Updated & saved '{dlg.result.get('name', '?')}'")

    def on_delete(self):
        if self.selected_index is None:
            messagebox.showinfo("Delete", "Select a component first.")
            return
        c = self.components[self.selected_index]
        if not messagebox.askyesno(
            "Confirm delete",
            f"Delete '{c.get('name', '?')}'?\n\n"
            f"A backup will be saved in .backups/"
        ): return
        del self.components[self.selected_index]
        if self._autosave(reason="delete"):
            self.refresh_table()
            self.status(f"✅ Removed & saved '{c.get('name', '?')}'")

    def on_import(self):
        path = filedialog.askopenfilename(
            title="Select components.js",
            filetypes=[("JavaScript", "*.js"), ("All files", "*.*")],
            initialdir=str(SCRIPT_DIR))
        if not path: return
        try:
            self.components = parse_components_js(Path(path))
            self.refresh_table()
            self.status(f"Imported {len(self.components)}")
        except Exception as e:
            messagebox.showerror("Import failed", str(e))

    def on_export(self):
        """Save a copy anywhere — the auto-save already writes to components.js."""
        if not self.components:
            if not messagebox.askyesno("Export", "No components. Export empty?"):
                return
        path = filedialog.asksaveasfilename(
            title="Save a copy of components.js", defaultextension=".js",
            initialfile="components.js", initialdir=str(SCRIPT_DIR),
            filetypes=[("JavaScript", "*.js")])
        if not path: return
        try:
            parts = [component_to_js(c) for c in self.components]
            body = ",\n".join(parts)
            content = f"const components = [\n{body}\n];\n"
            Path(path).write_text(content, encoding="utf-8")
            self.status(f"Exported copy ({len(self.components)} components)")
            messagebox.showinfo("Export complete",
                                f"Saved a copy with {len(self.components)} components.")
        except Exception as e:
            messagebox.showerror("Export failed", str(e))

    def on_open_images(self):
        IMAGES_DIR.mkdir(exist_ok=True)
        try:
            if sys.platform == "win32": os.startfile(str(IMAGES_DIR))
            elif sys.platform == "darwin": os.system(f'open "{IMAGES_DIR}"')
            else: os.system(f'xdg-open "{IMAGES_DIR}"')
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def status(self, msg):
        self.title(f"IK Electro — Component Manager   |   {msg}")


# ============================================================
# EDIT DIALOG — compact + collapsible advanced section
# ============================================================
class ComponentDialog(ctk.CTkToplevel):
    def __init__(self, parent, component, all_components):
        super().__init__(parent)
        self.withdraw()
        self.result = None
        self.all_components = all_components
        self.current_image_name = (component or {}).get("image", "") or ""

        is_edit = component is not None
        self.title("Edit Component" if is_edit else "Add Component")
        # Compact — fits small screens without scrolling off
        self.geometry("620x600")
        self.minsize(560, 480)
        self.resizable(True, True)
        self.configure(fg_color=COL_BG)
        self.transient(parent)

        c = component or {
            "id": self._next_id(), "name": "", "short": "",
            "price": 0, "currency": "DZD", "condition": "A",
            "stock": 1, "category": "modules", "tags": [],
            "image": "", "datasheets": [], "specs": {},
            "compatibility": [],
        }

        self._build(c)
        self._enable_dnd()
        self.deiconify()
        try:
            self.grab_set(); self.focus_force()
        except Exception:
            pass

    def _build(self, c):
        scroll = ctk.CTkScrollableFrame(self, fg_color=COL_BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=6, pady=6)
        body = scroll

        # ⚡ Fast mouse-wheel scrolling
        FastScroll(scroll, scroll, multiplier=40)

        def section(title, icon="●"):
            f = ctk.CTkFrame(body, fg_color="transparent")
            f.pack(fill="x", padx=10, pady=(14, 4))
            ctk.CTkLabel(f, text=f"{icon}  {title}",
                         font=ctk.CTkFont(size=12, weight="bold"),
                         text_color=COL_ACCENT).pack(anchor="w")
            ctk.CTkFrame(body, height=1, fg_color=COL_BG3).pack(
                fill="x", padx=10, pady=(2, 6))

        # ============================================================
        # 1. IMAGE
        # ============================================================
        section("Product Image", "🖼️")

        img_row = ctk.CTkFrame(body, fg_color="transparent")
        img_row.pack(fill="x", padx=10, pady=(0, 4))

        self.preview_box = ctk.CTkFrame(img_row, fg_color=COL_BG2,
                                        corner_radius=10, width=110, height=110)
        self.preview_box.pack(side="left", padx=(0, 12))
        self.preview_box.pack_propagate(False)

        right = ctk.CTkFrame(img_row, fg_color="transparent")
        right.pack(side="left", fill="both", expand=True)

        self.drop_hint = ctk.CTkLabel(
            right,
            text="⬇  Drag & drop an image here\nor click Browse below",
            font=ctk.CTkFont(size=11), text_color=COL_FG2,
            justify="left")
        self.drop_hint.pack(anchor="w")

        self.image_name_label = ctk.CTkLabel(
            right, text=self.current_image_name or "(no image)",
            font=ctk.CTkFont(size=10), text_color=COL_FG3,
            anchor="w", wraplength=340, justify="left")
        self.image_name_label.pack(anchor="w", pady=(6, 0))

        btn_row = ctk.CTkFrame(right, fg_color="transparent")
        btn_row.pack(anchor="w", pady=(8, 0))
        ctk.CTkButton(btn_row, text="📂  Browse", width=100, height=28,
                      fg_color=COL_ACCENT, hover_color=COL_ACCENT_HOVER,
                      text_color="#1a1a2e",
                      font=ctk.CTkFont(size=11, weight="bold"),
                      command=self.pick_image).pack(side="left")
        ctk.CTkButton(btn_row, text="✖  Clear", width=80, height=28,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG, font=ctk.CTkFont(size=11),
                      command=self.clear_image).pack(side="left", padx=6)

        self._refresh_preview()

        # ============================================================
        # 2. BASIC INFO
        # ============================================================
        section("Basic Info", "📛")

        row = ctk.CTkFrame(body, fg_color="transparent")
        row.pack(fill="x", padx=10, pady=(0, 6))

        col1 = ctk.CTkFrame(row, fg_color="transparent")
        col1.pack(side="left", fill="x", expand=True, padx=(0, 6))
        ctk.CTkLabel(col1, text="ID", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.id_var = tk.StringVar(value=c.get("id", ""))
        ctk.CTkEntry(col1, textvariable=self.id_var, height=30,
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3,
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        col2 = ctk.CTkFrame(row, fg_color="transparent")
        col2.pack(side="left", fill="x", expand=True, padx=(6, 0))
        ctk.CTkLabel(col2, text="Name", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.name_var = tk.StringVar(value=c.get("name", ""))
        ctk.CTkEntry(col2, textvariable=self.name_var, height=30,
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3,
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        ctk.CTkLabel(body, text="Short description", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w", padx=10, pady=(4, 2))
        self.short_text = ctk.CTkTextbox(
            body, height=48, fg_color=COL_BG2, text_color=COL_FG,
            border_color=COL_BG3, border_width=1,
            font=ctk.CTkFont(size=12))
        self.short_text.insert("1.0", c.get("short", ""))
        self.short_text.pack(fill="x", padx=10)

        # ============================================================
        # 3. PRICING & STOCK
        # ============================================================
        section("Pricing & Stock", "💰")

        row = ctk.CTkFrame(body, fg_color="transparent")
        row.pack(fill="x", padx=10, pady=(0, 4))

        c1 = ctk.CTkFrame(row, fg_color="transparent")
        c1.pack(side="left", fill="x", expand=True, padx=(0, 4))
        ctk.CTkLabel(c1, text="Price", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.price_var = tk.StringVar(value=str(c.get("price", 0)))
        ctk.CTkEntry(c1, textvariable=self.price_var, height=30,
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3,
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        c2 = ctk.CTkFrame(row, fg_color="transparent")
        c2.pack(side="left", fill="x", expand=True, padx=4)
        ctk.CTkLabel(c2, text="Currency", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.currency_var = tk.StringVar(value=c.get("currency", "DZD"))
        ctk.CTkEntry(c2, textvariable=self.currency_var, height=30,
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3,
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        c3 = ctk.CTkFrame(row, fg_color="transparent")
        c3.pack(side="left", fill="x", expand=True, padx=(4, 0))
        ctk.CTkLabel(c3, text="Stock", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.stock_var = tk.StringVar(value=str(c.get("stock", 0)))
        ctk.CTkEntry(c3, textvariable=self.stock_var, height=30,
                     fg_color=COL_BG2, text_color=COL_FG,
                     border_color=COL_BG3,
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        # ============================================================
        # 4. CLASSIFICATION
        # ============================================================
        section("Classification", "🏷️")

        row = ctk.CTkFrame(body, fg_color="transparent")
        row.pack(fill="x", padx=10, pady=(0, 4))

        c1 = ctk.CTkFrame(row, fg_color="transparent")
        c1.pack(side="left", fill="x", expand=True, padx=(0, 4))
        ctk.CTkLabel(c1, text="Condition", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        cond_values = [f"{k} — {v}" for k, v in CONDITIONS.items()]
        self.condition_var = tk.StringVar()
        for k, v in CONDITIONS.items():
            if k == c.get("condition", "A"):
                self.condition_var.set(f"{k} — {v}")
        ctk.CTkComboBox(c1, values=cond_values, variable=self.condition_var,
                        height=30, fg_color=COL_BG2,
                        border_color=COL_BG3, button_color=COL_ACCENT,
                        button_hover_color=COL_ACCENT_HOVER,
                        dropdown_fg_color=COL_BG2,
                        dropdown_text_color=COL_FG,
                        text_color=COL_FG, state="readonly",
                        font=ctk.CTkFont(size=12)).pack(fill="x")

        c2 = ctk.CTkFrame(row, fg_color="transparent")
        c2.pack(side="left", fill="x", expand=True, padx=(4, 0))
        ctk.CTkLabel(c2, text="Category", anchor="w",
                     font=ctk.CTkFont(size=11),
                     text_color=COL_FG3).pack(anchor="w")
        self.category_var = tk.StringVar(value=c.get("category", "modules"))
        ctk.CTkComboBox(c2, values=CATEGORIES, variable=self.category_var,
                        height=30, fg_color=COL_BG2,
                        border_color=COL_BG3, button_color=COL_ACCENT,
                        button_hover_color=COL_ACCENT_HOVER,
                        dropdown_fg_color=COL_BG2,
                        dropdown_text_color=COL_FG,
                        text_color=COL_FG,
                        font=ctk.CTkFont(size=12)).pack(fill="x")

        # ============================================================
        # 5. SPECIFICATIONS
        # ============================================================
        section("Specifications", "📋")

        self.specs_editor = SpecsEditor(body, specs_dict=c.get("specs") or {})
        self.specs_editor.pack(fill="x", padx=10)

        # ============================================================
        # 6. MORE OPTIONS (collapsible)
        # ============================================================
        self._adv_open = False
        self._adv_toggle_btn = ctk.CTkButton(
            body, text="▸  More options  (tags, compatibility, datasheets)",
            anchor="w", height=32,
            fg_color=COL_BG2, hover_color=COL_BG3,
            text_color=COL_ACCENT,
            font=ctk.CTkFont(size=11, weight="bold"),
            command=self._toggle_advanced,
        )
        self._adv_toggle_btn.pack(fill="x", padx=10, pady=(14, 4))

        self._adv_frame = ctk.CTkFrame(body, fg_color="transparent")

        # --- Compatibility ---
        ctk.CTkLabel(self._adv_frame, text="🔌  Compatibility  (comma-separated)",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color=COL_FG2, anchor="w").pack(anchor="w", padx=10,
                                                          pady=(6, 2))
        self.compat_editor = ListEditor(
            self._adv_frame, items=c.get("compatibility", []) or [],
            placeholder="Arduino, ESP32, Raspberry Pi")
        self.compat_editor.pack(fill="x", padx=10)

        # --- Tags ---
        ctk.CTkLabel(self._adv_frame, text="🏷️  Tags  (comma-separated)",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color=COL_FG2, anchor="w").pack(anchor="w", padx=10,
                                                          pady=(10, 2))
        self.tags_editor = ListEditor(
            self._adv_frame, items=c.get("tags", []) or [],
            placeholder="sensor, IR, ultrasonic")
        self.tags_editor.pack(fill="x", padx=10)

        # --- Datasheets ---
        ctk.CTkLabel(self._adv_frame, text="📄  Datasheets  (one URL per line)",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color=COL_FG2, anchor="w").pack(anchor="w", padx=10,
                                                          pady=(10, 2))
        self.ds_editor = ListEditor(
            self._adv_frame, items=c.get("datasheets", []) or [],
            as_lines=True)
        self.ds_editor.pack(fill="x", padx=10, pady=(0, 6))

        # ============================================================
        # BOTTOM BUTTONS (fixed)
        # ============================================================
        btn_row = ctk.CTkFrame(self, fg_color=COL_BG, corner_radius=0)
        btn_row.pack(fill="x", padx=16, pady=10)

        ctk.CTkButton(btn_row, text="Cancel", width=100, height=36,
                      fg_color=COL_BG3, hover_color=COL_BG4,
                      text_color=COL_FG, font=ctk.CTkFont(size=12),
                      command=self.destroy).pack(side="right", padx=6)

        ctk.CTkButton(btn_row, text="💾  Save", width=140, height=36,
                      fg_color=COL_ACCENT, hover_color=COL_ACCENT_HOVER,
                      text_color="#1a1a2e",
                      font=ctk.CTkFont(size=13, weight="bold"),
                      command=self.on_save).pack(side="right", padx=6)

    def _toggle_advanced(self):
        self._adv_open = not self._adv_open
        if self._adv_open:
            self._adv_frame.pack(fill="x", padx=10, pady=(0, 8))
            self._adv_toggle_btn.configure(
                text="▾  More options  (tags, compatibility, datasheets)")
        else:
            self._adv_frame.pack_forget()
            self._adv_toggle_btn.configure(
                text="▸  More options  (tags, compatibility, datasheets)")

    def _enable_dnd(self):
        if not DND_AVAILABLE: return
        for target in (self, self.preview_box, self.drop_hint,
                       self.image_name_label):
            try:
                target.drop_target_register(DND_FILES)
                target.dnd_bind("<<Drop>>", self._on_drop)
            except Exception:
                pass

    def _on_drop(self, event):
        raw = event.data or ""
        paths = re.findall(r"\{([^}]+)\}|(\S+)", raw)
        candidates = [p[0] or p[1] for p in paths]
        images = [p for p in candidates if Path(p).suffix.lower() in
                  (".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp")]
        if not images:
            messagebox.showwarning("Not an image",
                                   "Please drop an image file.")
            return
        self._set_image_from_path(images[0])

    def pick_image(self):
        path = filedialog.askopenfilename(
            title="Choose product image",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.webp *.gif *.bmp"),
                       ("All files", "*.*")],
            initialdir=str(IMAGES_DIR if IMAGES_DIR.exists() else SCRIPT_DIR))
        if not path: return
        self._set_image_from_path(path)

    def _set_image_from_path(self, path):
        try:
            name = import_image_to_folder(path)
            self.current_image_name = name
            self.image_name_label.configure(text=name)
            self._refresh_preview()
        except Exception as e:
            messagebox.showerror("Image failed", str(e))

    def clear_image(self):
        self.current_image_name = ""
        self.image_name_label.configure(text="(no image)")
        self._refresh_preview()

    def _refresh_preview(self):
        for w in self.preview_box.winfo_children():
            w.destroy()

        name = self.current_image_name
        if name:
            path = IMAGES_DIR / name
            if path.exists():
                try:
                    img = Image.open(path).convert("RGBA")
                    img.thumbnail((102, 102), Image.LANCZOS)
                    cimg = ctk.CTkImage(light_image=img, dark_image=img,
                                        size=img.size)
                    ctk.CTkLabel(self.preview_box, image=cimg, text="").pack(
                        expand=True, fill="both", padx=4, pady=4)
                    return
                except Exception:
                    pass
            ctk.CTkLabel(self.preview_box,
                         text=f"⚠️\nnot found\n{name[:16]}",
                         font=ctk.CTkFont(size=10),
                         text_color=COL_DANGER,
                         justify="center").pack(expand=True, fill="both")
        else:
            ctk.CTkLabel(self.preview_box, text="🖼️",
                         font=ctk.CTkFont(size=32),
                         text_color=COL_FG3).pack(expand=True, fill="both")

    def _next_id(self):
        max_n = 0
        for c in self.all_components:
            m = re.match(r"comp-(\d+)", c.get("id", ""))
            if m: max_n = max(max_n, int(m.group(1)))
        return f"comp-{max_n + 1:03d}"

    def on_save(self):
        if not self.id_var.get().strip():
            messagebox.showerror("Validation", "ID is required."); return
        if not self.name_var.get().strip():
            messagebox.showerror("Validation", "Name is required."); return
        try:
            price = int(float(self.price_var.get() or 0))
        except ValueError:
            messagebox.showerror("Validation", "Price must be a number."); return
        try:
            stock = int(self.stock_var.get() or 0)
        except ValueError:
            messagebox.showerror("Validation", "Stock must be a whole number."); return

        cond_text = self.condition_var.get()
        cond_letter = cond_text.split(" ")[0] if cond_text else "A"
        if cond_letter not in CONDITIONS: cond_letter = "A"

        self.result = {
            "id": self.id_var.get().strip(),
            "name": self.name_var.get().strip(),
            "short": self.short_text.get("1.0", "end").strip(),
            "price": price,
            "currency": self.currency_var.get().strip() or "DZD",
            "condition": cond_letter,
            "stock": stock,
            "category": self.category_var.get().strip() or "modules",
            "tags": self.tags_editor.get_list(),
            "image": self.current_image_name,
            "datasheets": self.ds_editor.get_list(),
            "specs": self.specs_editor.get_specs(),
            "compatibility": self.compat_editor.get_list(),
        }
        self.destroy()


# ============================================================
# MAIN
# ============================================================
def main():
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()