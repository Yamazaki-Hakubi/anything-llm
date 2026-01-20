#!/usr/bin/env python3
"""
TERMINAL ANIMATED DEMO
Shows animated gauges and charts in the terminal without GUI dependencies
"""

import sys
import time
import math
import random
import os
from datetime import datetime

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Foreground
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

    # Bright foreground
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'

    # Background
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'


def clear_screen():
    """Clear terminal screen"""
    print('\033[2J\033[H', end='')


def move_cursor(row, col):
    """Move cursor to position"""
    print(f'\033[{row};{col}H', end='')


def hide_cursor():
    """Hide terminal cursor"""
    print('\033[?25l', end='')


def show_cursor():
    """Show terminal cursor"""
    print('\033[?25h', end='')


class AnimatedPillGauge:
    """Terminal pill gauge"""

    def __init__(self, title, min_val=0, max_val=100, width=40, color=Colors.YELLOW):
        self.title = title
        self.min_val = min_val
        self.max_val = max_val
        self.width = width
        self.color = color
        self.value = min_val
        self.target = min_val
        self.glow_phase = 0

    def set_value(self, val):
        self.target = max(self.min_val, min(self.max_val, val))

    def update(self):
        # Smooth animation
        diff = self.target - self.value
        self.value += diff * 0.15
        self.glow_phase += 0.2

    def render(self):
        # Calculate fill
        pct = (self.value - self.min_val) / (self.max_val - self.min_val)
        filled = int(self.width * pct)

        # Glow effect (pulse the fill character)
        glow = abs(math.sin(self.glow_phase))

        # Build gauge
        fill_char = '█' if glow > 0.5 else '▓'
        empty_char = '░'

        # Frame characters
        left_cap = '╔'
        right_cap = '╗'
        left_end = '╚'
        right_end = '╝'

        # Title line
        title_line = f"  {Colors.BOLD}{self.color}{self.title}{Colors.RESET}"

        # Top frame
        top = f"  {left_cap}{'═' * (self.width + 2)}{right_cap}"

        # Gauge bar
        bar_fill = f"{self.color}{fill_char * filled}{Colors.RESET}"
        bar_empty = f"{Colors.DIM}{empty_char * (self.width - filled)}{Colors.RESET}"
        bar = f"  ║ {bar_fill}{bar_empty} ║"

        # Bottom frame
        bottom = f"  {left_end}{'═' * (self.width + 2)}{right_end}"

        # Value display
        if self.max_val > 1000:
            val_str = f"{self.value:,.0f}"
        elif self.max_val > 100:
            val_str = f"{self.value:.1f}"
        else:
            val_str = f"{self.value:.1f}%"

        value_line = f"  {self.color}{val_str}{Colors.RESET}"

        return [title_line, top, bar, bottom, value_line]


class AnimatedCircularGauge:
    """Terminal circular gauge using ASCII art"""

    def __init__(self, title, max_val=100, color=Colors.CYAN):
        self.title = title
        self.max_val = max_val
        self.color = color
        self.value = 0
        self.target = 0
        self.phase = 0

    def set_value(self, val):
        self.target = max(0, min(self.max_val, val))

    def update(self):
        diff = self.target - self.value
        self.value += diff * 0.12
        self.phase += 0.15

    def render(self):
        pct = self.value / self.max_val

        # ASCII circle with fill indicator
        # Use segments to show progress
        segments = 8
        filled_segments = int(segments * pct)

        # Rotation indicator
        rot = int(self.phase) % 4
        rotation_chars = ['◐', '◓', '◑', '◒']
        rot_char = rotation_chars[rot]

        # Build circular representation
        glow = '●' if math.sin(self.phase * 2) > 0 else '○'

        lines = [
            f"    {self.color}╭─────────╮{Colors.RESET}",
            f"    {self.color}│{Colors.RESET}  {glow} {rot_char} {glow}  {self.color}│{Colors.RESET}",
            f"    {self.color}│{Colors.RESET} {Colors.BOLD}{self.color}{self.value:5.1f}%{Colors.RESET}  {self.color}│{Colors.RESET}",
            f"    {self.color}│{Colors.RESET}  {glow} {glow} {glow}  {self.color}│{Colors.RESET}",
            f"    {self.color}╰─────────╯{Colors.RESET}",
            f"    {Colors.BOLD}{self.title}{Colors.RESET}",
        ]

        return lines


class AnimatedSpeedometer:
    """Terminal speedometer with needle"""

    def __init__(self, title, max_val=100, warning=70, critical=90, color=Colors.GREEN):
        self.title = title
        self.max_val = max_val
        self.warning = warning
        self.critical = critical
        self.color = color
        self.value = 0
        self.target = 0
        self.phase = 0

    def set_value(self, val):
        self.target = max(0, min(self.max_val, val))

    def update(self):
        diff = self.target - self.value
        self.value += diff * 0.1
        self.phase += 0.1

    def render(self):
        pct = self.value / self.max_val

        # Determine color based on value
        if self.value >= self.critical:
            val_color = Colors.BRIGHT_RED
        elif self.value >= self.warning:
            val_color = Colors.BRIGHT_YELLOW
        else:
            val_color = Colors.BRIGHT_GREEN

        # Needle position (0-10 scale)
        needle_pos = int(pct * 10)

        # Build speedometer
        scale = "0   2   4   6   8  10"
        ticks = "├───┼───┼───┼───┼───┤"

        # Needle line
        needle_line = " " * (needle_pos * 2) + f"{val_color}▼{Colors.RESET}"

        lines = [
            f"  {Colors.DIM}{scale}{Colors.RESET}",
            f"  {Colors.DIM}{ticks}{Colors.RESET}",
            f"  {needle_line}",
            f"  {val_color}{Colors.BOLD}{self.value:6.1f}{Colors.RESET}",
            f"  {self.title}",
        ]

        return lines


class LiveLineChart:
    """Terminal line chart"""

    def __init__(self, title, width=50, height=10, color=Colors.CYAN):
        self.title = title
        self.width = width
        self.height = height
        self.color = color
        self.data = [0] * width

    def add_point(self, value):
        self.data.append(value)
        self.data = self.data[-self.width:]

    def render(self):
        if not self.data or max(self.data) == min(self.data):
            return [f"  {self.title}: No data"]

        min_val = min(self.data)
        max_val = max(self.data)
        range_val = max_val - min_val if max_val != min_val else 1

        # Build chart
        lines = [f"  {Colors.BOLD}{self.color}{self.title}{Colors.RESET}"]
        lines.append(f"  {Colors.DIM}Max: {max_val:.1f}{Colors.RESET}")

        chart_chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

        chart_line = "  "
        for val in self.data[-self.width:]:
            normalized = (val - min_val) / range_val
            char_idx = int(normalized * (len(chart_chars) - 1))
            chart_line += f"{self.color}{chart_chars[char_idx]}{Colors.RESET}"

        lines.append(chart_line)
        lines.append(f"  {Colors.DIM}Min: {min_val:.1f}{Colors.RESET}")

        return lines


class LiveBarChart:
    """Terminal bar chart"""

    def __init__(self, title, categories, colors=None):
        self.title = title
        self.categories = categories
        self.colors = colors or [Colors.CYAN] * len(categories)
        self.values = {cat: 0 for cat in categories}
        self.targets = {cat: 0 for cat in categories}

    def set_value(self, category, value):
        if category in self.targets:
            self.targets[category] = value

    def update(self):
        for cat in self.categories:
            diff = self.targets[cat] - self.values[cat]
            self.values[cat] += diff * 0.15

    def render(self):
        lines = [f"  {Colors.BOLD}{self.title}{Colors.RESET}"]

        max_val = max(self.values.values()) if self.values else 1
        bar_width = 30

        for i, cat in enumerate(self.categories):
            val = self.values[cat]
            pct = val / max_val if max_val > 0 else 0
            filled = int(bar_width * pct)

            color = self.colors[i % len(self.colors)]
            bar = f"{color}{'█' * filled}{Colors.DIM}{'░' * (bar_width - filled)}{Colors.RESET}"

            lines.append(f"  {cat:5} {bar} {val:6.0f}")

        return lines


class AnimatedRadarChart:
    """Terminal radar chart"""

    def __init__(self, title, categories):
        self.title = title
        self.categories = categories
        self.values = {cat: 0 for cat in categories}
        self.targets = {cat: 0 for cat in categories}
        self.phase = 0

    def set_values(self, values):
        for cat, val in values.items():
            if cat in self.targets:
                self.targets[cat] = val

    def update(self):
        for cat in self.categories:
            diff = self.targets[cat] - self.values[cat]
            self.values[cat] += diff * 0.1
        self.phase += 0.15

    def render(self):
        lines = [f"  {Colors.BOLD}{Colors.CYAN}{self.title}{Colors.RESET}"]

        # Scan indicator
        scan_idx = int(self.phase) % len(self.categories)

        for i, cat in enumerate(self.categories):
            val = self.values[cat]
            pct = val / 100

            # Bar representation
            bar_width = 20
            filled = int(bar_width * pct)

            # Highlight current scan position
            if i == scan_idx:
                color = Colors.BRIGHT_CYAN
                marker = '►'
            else:
                color = Colors.CYAN
                marker = ' '

            bar = f"{color}{'▓' * filled}{Colors.DIM}{'░' * (bar_width - filled)}{Colors.RESET}"
            lines.append(f"  {marker}{cat:12} {bar} {val:5.1f}")

        return lines


class AnimatedHeatmap:
    """Terminal heatmap"""

    def __init__(self, title, rows=5, cols=12):
        self.title = title
        self.rows = rows
        self.cols = cols
        self.data = [[0 for _ in range(cols)] for _ in range(rows)]
        self.phase = 0

    def set_data(self, data):
        for i in range(min(len(data), self.rows)):
            for j in range(min(len(data[i]), self.cols)):
                self.data[i][j] = data[i][j]

    def update(self):
        self.phase += 0.1

    def render(self):
        lines = [f"  {Colors.BOLD}{self.title}{Colors.RESET}"]

        # Heat colors (from cool to hot)
        heat_chars = [
            (Colors.BLUE, '░'),
            (Colors.CYAN, '▒'),
            (Colors.GREEN, '▓'),
            (Colors.YELLOW, '█'),
            (Colors.RED, '█'),
        ]

        for row in self.data:
            line = "  "
            for val in row:
                idx = min(int(val * len(heat_chars)), len(heat_chars) - 1)
                color, char = heat_chars[idx]
                line += f"{color}{char}{Colors.RESET}"
            lines.append(line)

        return lines


class AnimatedWaveform:
    """Terminal audio waveform"""

    def __init__(self, title, bars=32, color=Colors.GREEN):
        self.title = title
        self.bars = bars
        self.color = color
        self.values = [0] * bars
        self.phase = 0

    def set_random(self):
        for i in range(self.bars):
            self.values[i] = random.uniform(0.1, 1.0)

    def update(self):
        self.phase += 0.2
        # Add wave motion
        for i in range(self.bars):
            wave = math.sin(self.phase + i * 0.3) * 0.2
            self.values[i] = max(0.1, min(1.0, self.values[i] + wave * 0.1))

    def render(self):
        lines = [f"  {Colors.BOLD}{self.color}{self.title}{Colors.RESET}"]

        bar_chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

        # Top half
        top_line = "  "
        for val in self.values:
            idx = int(val * (len(bar_chars) - 1))
            top_line += f"{self.color}{bar_chars[idx]}{Colors.RESET}"
        lines.append(top_line)

        # Bottom half (mirrored)
        bottom_line = "  "
        for val in self.values:
            idx = int(val * (len(bar_chars) - 1))
            bottom_line += f"{self.color}{bar_chars[len(bar_chars) - 1 - idx]}{Colors.RESET}"
        lines.append(bottom_line)

        return lines


def run_demo():
    """Run the animated terminal demo"""

    print("\n" + "="*70)
    print(f"{Colors.BOLD}{Colors.CYAN}  🚀 ANIMATED GAUGES & CHARTS - TERMINAL DEMO{Colors.RESET}")
    print("="*70)
    print(f"\n{Colors.DIM}  This demonstrates the animation concepts without GUI dependencies.")
    print(f"  The PyQt6 version has smoother 60fps graphics with glowing effects.{Colors.RESET}")
    print(f"\n  Press Ctrl+C to exit\n")

    # Create widgets
    pnl_gauge = AnimatedPillGauge("💰 P&L", -10000, 10000, 40, Colors.YELLOW)
    win_gauge = AnimatedPillGauge("📈 Win Rate", 0, 100, 40, Colors.GREEN)
    risk_gauge = AnimatedPillGauge("⚠️  Risk", 0, 100, 40, Colors.RED)
    latency_gauge = AnimatedPillGauge("⚡ Latency (ms)", 0, 200, 40, Colors.BLUE)

    cpu_gauge = AnimatedCircularGauge("CPU", 100, Colors.CYAN)
    mem_gauge = AnimatedCircularGauge("Memory", 100, Colors.MAGENTA)

    speed_gauge = AnimatedSpeedometer("Order Rate", 500, 350, 450, Colors.GREEN)

    pnl_chart = LiveLineChart("📊 P&L History", 50, 8, Colors.GREEN)

    volume_chart = LiveBarChart(
        "📊 Volume by Asset",
        ["BTC", "ETH", "SOL", "ADA", "DOT"],
        [Colors.YELLOW, Colors.BLUE, Colors.GREEN, Colors.CYAN, Colors.MAGENTA]
    )

    radar = AnimatedRadarChart(
        "📡 Performance Radar",
        ["Speed", "Accuracy", "Efficiency", "Reliability", "Throughput"]
    )

    heatmap = AnimatedHeatmap("🌡️  Activity Heatmap", 5, 24)

    waveform = AnimatedWaveform("🎵 Market Signal", 40, Colors.CYAN)

    # Initialize values
    pnl_gauge.set_value(2500)
    win_gauge.set_value(65)
    risk_gauge.set_value(35)
    latency_gauge.set_value(45)
    cpu_gauge.set_value(42)
    mem_gauge.set_value(67)
    speed_gauge.set_value(280)

    hide_cursor()

    try:
        frame = 0
        while True:
            # Update values with random walk
            pnl_gauge.set_value(pnl_gauge.target + random.uniform(-200, 220))
            win_gauge.set_value(max(40, min(80, win_gauge.target + random.uniform(-1, 1))))
            risk_gauge.set_value(max(10, min(60, risk_gauge.target + random.uniform(-2, 2))))
            latency_gauge.set_value(max(10, min(150, latency_gauge.target + random.uniform(-10, 10))))
            cpu_gauge.set_value(max(10, min(90, cpu_gauge.target + random.uniform(-5, 5))))
            mem_gauge.set_value(max(30, min(85, mem_gauge.target + random.uniform(-3, 3))))
            speed_gauge.set_value(max(50, min(480, speed_gauge.target + random.uniform(-30, 30))))

            # Add chart data
            pnl_chart.add_point(pnl_gauge.value)

            # Update volume chart
            volume_chart.set_value("BTC", random.uniform(800, 1500))
            volume_chart.set_value("ETH", random.uniform(500, 1000))
            volume_chart.set_value("SOL", random.uniform(300, 700))
            volume_chart.set_value("ADA", random.uniform(200, 500))
            volume_chart.set_value("DOT", random.uniform(150, 400))

            # Update radar
            radar.set_values({
                "Speed": random.uniform(50, 90),
                "Accuracy": random.uniform(60, 95),
                "Efficiency": random.uniform(45, 85),
                "Reliability": random.uniform(70, 99),
                "Throughput": random.uniform(40, 80),
            })

            # Update heatmap
            heat_data = [[random.uniform(0, 0.8) for _ in range(24)] for _ in range(5)]
            heat_data[random.randint(0, 4)][random.randint(0, 23)] = random.uniform(0.8, 1.0)
            heatmap.set_data(heat_data)

            # Update waveform
            waveform.set_random()

            # Update all widgets
            pnl_gauge.update()
            win_gauge.update()
            risk_gauge.update()
            latency_gauge.update()
            cpu_gauge.update()
            mem_gauge.update()
            speed_gauge.update()
            volume_chart.update()
            radar.update()
            heatmap.update()
            waveform.update()

            # Render
            clear_screen()

            print(f"\n{Colors.BOLD}{Colors.CYAN}  ══════════════════════════════════════════════════════════════{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.CYAN}  📊 ANIMATED TRADING DASHBOARD - TERMINAL DEMO{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.CYAN}  ══════════════════════════════════════════════════════════════{Colors.RESET}")
            print(f"  {Colors.DIM}Frame: {frame}  |  Time: {datetime.now().strftime('%H:%M:%S')}{Colors.RESET}\n")

            # Pill gauges section
            print(f"  {Colors.BOLD}━━━ PILL GAUGES (Glowing Capsules) ━━━{Colors.RESET}")
            for line in pnl_gauge.render():
                print(line)
            print()
            for line in win_gauge.render():
                print(line)
            print()
            for line in risk_gauge.render():
                print(line)
            print()
            for line in latency_gauge.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ CIRCULAR GAUGES ━━━{Colors.RESET}")
            # Side by side circular gauges
            cpu_lines = cpu_gauge.render()
            mem_lines = mem_gauge.render()
            for i in range(max(len(cpu_lines), len(mem_lines))):
                cpu_line = cpu_lines[i] if i < len(cpu_lines) else ""
                mem_line = mem_lines[i] if i < len(mem_lines) else ""
                print(f"{cpu_line:30} {mem_line}")

            print(f"\n  {Colors.BOLD}━━━ SPEEDOMETER ━━━{Colors.RESET}")
            for line in speed_gauge.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ LIVE LINE CHART ━━━{Colors.RESET}")
            for line in pnl_chart.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ BAR CHART ━━━{Colors.RESET}")
            for line in volume_chart.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ RADAR CHART (with Scan Effect) ━━━{Colors.RESET}")
            for line in radar.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ HEATMAP ━━━{Colors.RESET}")
            for line in heatmap.render():
                print(line)

            print(f"\n  {Colors.BOLD}━━━ WAVEFORM ━━━{Colors.RESET}")
            for line in waveform.render():
                print(line)

            print(f"\n{Colors.DIM}  Press Ctrl+C to exit{Colors.RESET}")

            frame += 1
            time.sleep(0.1)  # 10 FPS for terminal

    except KeyboardInterrupt:
        pass
    finally:
        show_cursor()
        print(f"\n{Colors.GREEN}✓ Demo finished{Colors.RESET}\n")


if __name__ == "__main__":
    run_demo()
