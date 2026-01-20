"""
ANIMATED GAUGES AND LIVE CHARTS DASHBOARD
Professional trading monitoring with stunning animated visualizations
Inspired by elegant gauge designs with glowing effects
"""

import sys
import math
import numpy as np
from datetime import datetime, timedelta
from collections import deque
import random

from PyQt6.QtWidgets import *
from PyQt6.QtCore import *
from PyQt6.QtGui import *

# ============================================================================
# ANIMATED GAUGE WIDGETS
# ============================================================================

class AnimatedPillGauge(QWidget):
    """
    Animated pill-shaped gauge with glowing effects
    Inspired by the elegant capsule design with inner glow
    """

    def __init__(self,
                 title: str = "Metric",
                 subtitle: str = "",
                 min_value: float = 0,
                 max_value: float = 100,
                 unit: str = "%",
                 color_scheme: str = "gold",
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.subtitle = subtitle
        self.min_value = min_value
        self.max_value = max_value
        self.unit = unit
        self.color_scheme = color_scheme

        # Current and target values for animation
        self._current_value = min_value
        self._target_value = min_value
        self._display_value = min_value

        # Animation properties
        self._glow_phase = 0.0
        self._pulse_phase = 0.0
        self._particle_phase = 0.0

        # Color schemes
        self.color_schemes = {
            "gold": {
                "primary": QColor(255, 215, 0),
                "secondary": QColor(255, 180, 0),
                "glow": QColor(255, 230, 100),
                "bg_start": QColor(80, 60, 20),
                "bg_end": QColor(40, 30, 10),
            },
            "red": {
                "primary": QColor(220, 50, 50),
                "secondary": QColor(150, 30, 30),
                "glow": QColor(255, 100, 100),
                "bg_start": QColor(60, 20, 20),
                "bg_end": QColor(30, 10, 10),
            },
            "blue": {
                "primary": QColor(100, 180, 255),
                "secondary": QColor(50, 120, 200),
                "glow": QColor(150, 200, 255),
                "bg_start": QColor(20, 40, 80),
                "bg_end": QColor(10, 20, 40),
            },
            "green": {
                "primary": QColor(50, 255, 150),
                "secondary": QColor(30, 200, 100),
                "glow": QColor(100, 255, 180),
                "bg_start": QColor(20, 60, 40),
                "bg_end": QColor(10, 30, 20),
            },
            "purple": {
                "primary": QColor(180, 100, 255),
                "secondary": QColor(120, 50, 200),
                "glow": QColor(200, 150, 255),
                "bg_start": QColor(50, 20, 80),
                "bg_end": QColor(25, 10, 40),
            },
            "cyan": {
                "primary": QColor(0, 255, 255),
                "secondary": QColor(0, 200, 200),
                "glow": QColor(100, 255, 255),
                "bg_start": QColor(20, 60, 60),
                "bg_end": QColor(10, 30, 30),
            },
        }

        # Setup widget
        self.setMinimumSize(300, 80)
        self.setMaximumHeight(100)

        # Animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)  # ~60 FPS

        # Value animation timer
        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_value)
        self.value_timer.start(16)

    def setValue(self, value: float):
        """Set the target value with animation"""
        self._target_value = max(self.min_value, min(self.max_value, value))

    def value(self) -> float:
        return self._current_value

    def _animate(self):
        """Update animation phases"""
        self._glow_phase += 0.05
        self._pulse_phase += 0.03
        self._particle_phase += 0.02

        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi
        if self._pulse_phase > 2 * math.pi:
            self._pulse_phase -= 2 * math.pi
        if self._particle_phase > 2 * math.pi:
            self._particle_phase -= 2 * math.pi

        self.update()

    def _animate_value(self):
        """Smoothly animate value changes"""
        diff = self._target_value - self._display_value
        if abs(diff) > 0.01:
            self._display_value += diff * 0.1
            self._current_value = self._display_value

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Get colors
        colors = self.color_schemes.get(self.color_scheme, self.color_schemes["gold"])

        # Calculate dimensions
        width = self.width()
        height = self.height()

        # Gauge area
        gauge_x = 100
        gauge_y = 20
        gauge_width = width - 140
        gauge_height = 40

        # Draw outer frame (steampunk style)
        self._draw_frame(painter, gauge_x - 10, gauge_y - 5, gauge_width + 20, gauge_height + 10, colors)

        # Draw gauge background
        self._draw_gauge_background(painter, gauge_x, gauge_y, gauge_width, gauge_height, colors)

        # Draw fill with glow
        fill_percentage = (self._display_value - self.min_value) / (self.max_value - self.min_value)
        self._draw_gauge_fill(painter, gauge_x, gauge_y, gauge_width, gauge_height, fill_percentage, colors)

        # Draw particles/energy effect
        self._draw_energy_particles(painter, gauge_x, gauge_y, gauge_width, gauge_height, fill_percentage, colors)

        # Draw glass overlay
        self._draw_glass_overlay(painter, gauge_x, gauge_y, gauge_width, gauge_height)

        # Draw title and value
        self._draw_labels(painter, gauge_x, gauge_y, gauge_width, gauge_height, colors)

    def _draw_frame(self, painter, x, y, w, h, colors):
        """Draw steampunk-style frame"""
        # Outer border
        frame_path = QPainterPath()
        frame_path.addRoundedRect(QRectF(x, y, w, h), h/2, h/2)

        # Bronze/copper gradient for frame
        frame_gradient = QLinearGradient(x, y, x, y + h)
        frame_gradient.setColorAt(0, QColor(139, 90, 43))
        frame_gradient.setColorAt(0.3, QColor(205, 133, 63))
        frame_gradient.setColorAt(0.5, QColor(244, 164, 96))
        frame_gradient.setColorAt(0.7, QColor(205, 133, 63))
        frame_gradient.setColorAt(1, QColor(139, 90, 43))

        painter.setBrush(QBrush(frame_gradient))
        painter.setPen(QPen(QColor(80, 50, 20), 2))
        painter.drawPath(frame_path)

        # Inner shadow
        inner_shadow = QPainterPath()
        inner_shadow.addRoundedRect(QRectF(x + 3, y + 3, w - 6, h - 6), (h-6)/2, (h-6)/2)
        painter.setBrush(QBrush(QColor(0, 0, 0, 100)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(inner_shadow)

    def _draw_gauge_background(self, painter, x, y, w, h, colors):
        """Draw gauge background with gradient"""
        bg_path = QPainterPath()
        bg_path.addRoundedRect(QRectF(x, y, w, h), h/2, h/2)

        # Dark gradient background
        bg_gradient = QLinearGradient(x, y, x, y + h)
        bg_gradient.setColorAt(0, colors["bg_start"])
        bg_gradient.setColorAt(0.5, colors["bg_end"])
        bg_gradient.setColorAt(1, colors["bg_start"])

        painter.setBrush(QBrush(bg_gradient))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(bg_path)

    def _draw_gauge_fill(self, painter, x, y, w, h, percentage, colors):
        """Draw animated fill with glow effect"""
        if percentage <= 0:
            return

        fill_width = w * percentage

        # Create clipping path for pill shape
        clip_path = QPainterPath()
        clip_path.addRoundedRect(QRectF(x, y, w, h), h/2, h/2)
        painter.setClipPath(clip_path)

        # Pulsing glow intensity
        glow_intensity = 0.7 + 0.3 * math.sin(self._pulse_phase)

        # Draw outer glow
        for i in range(5, 0, -1):
            glow_color = QColor(colors["glow"])
            glow_color.setAlpha(int(30 * glow_intensity * (6 - i) / 5))

            glow_rect = QRectF(x - i, y - i, fill_width + i * 2, h + i * 2)
            painter.setBrush(QBrush(glow_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(glow_rect, (h + i * 2) / 2, (h + i * 2) / 2)

        # Main fill gradient
        fill_gradient = QLinearGradient(x, y, x, y + h)

        primary_bright = QColor(colors["primary"])
        primary_bright.setAlpha(int(255 * glow_intensity))

        fill_gradient.setColorAt(0, colors["secondary"])
        fill_gradient.setColorAt(0.3, primary_bright)
        fill_gradient.setColorAt(0.5, colors["glow"])
        fill_gradient.setColorAt(0.7, primary_bright)
        fill_gradient.setColorAt(1, colors["secondary"])

        fill_rect = QRectF(x, y, fill_width, h)
        painter.setBrush(QBrush(fill_gradient))
        painter.drawRoundedRect(fill_rect, h/2, h/2)

        # Center bright line (energy core)
        center_gradient = QLinearGradient(x, y + h/2 - 3, x, y + h/2 + 3)
        bright_core = QColor(255, 255, 255, int(200 * glow_intensity))
        center_gradient.setColorAt(0, QColor(255, 255, 255, 0))
        center_gradient.setColorAt(0.5, bright_core)
        center_gradient.setColorAt(1, QColor(255, 255, 255, 0))

        painter.setBrush(QBrush(center_gradient))
        painter.drawRect(QRectF(x + h/4, y + h/2 - 4, fill_width - h/2, 8))

        painter.setClipping(False)

    def _draw_energy_particles(self, painter, x, y, w, h, percentage, colors):
        """Draw animated energy particles"""
        if percentage <= 0.05:
            return

        fill_width = w * percentage

        # Create clipping path
        clip_path = QPainterPath()
        clip_path.addRoundedRect(QRectF(x, y, fill_width, h), h/2, h/2)
        painter.setClipPath(clip_path)

        # Draw particles
        num_particles = int(20 * percentage)
        for i in range(num_particles):
            # Particle position based on phase
            particle_x = x + (fill_width * 0.9) * ((i / num_particles + self._particle_phase / (2 * math.pi)) % 1)
            particle_y = y + h/2 + math.sin(self._particle_phase * 3 + i) * (h/3)

            # Particle size and opacity
            size = 2 + math.sin(self._particle_phase * 2 + i * 0.5) * 1.5
            opacity = 100 + int(100 * math.sin(self._particle_phase + i))

            particle_color = QColor(colors["glow"])
            particle_color.setAlpha(opacity)

            painter.setBrush(QBrush(particle_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(particle_x, particle_y), size, size)

        painter.setClipping(False)

    def _draw_glass_overlay(self, painter, x, y, w, h):
        """Draw glass/reflection overlay"""
        # Top highlight
        highlight_path = QPainterPath()
        highlight_path.addRoundedRect(QRectF(x + 5, y + 3, w - 10, h/3), h/6, h/6)

        highlight_gradient = QLinearGradient(x, y, x, y + h/3)
        highlight_gradient.setColorAt(0, QColor(255, 255, 255, 80))
        highlight_gradient.setColorAt(1, QColor(255, 255, 255, 0))

        painter.setBrush(QBrush(highlight_gradient))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(highlight_path)

    def _draw_labels(self, painter, gauge_x, gauge_y, gauge_w, gauge_h, colors):
        """Draw title, subtitle, and value labels"""
        # Title (left side)
        painter.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        painter.setPen(QPen(colors["primary"]))

        title_rect = QRect(5, gauge_y, gauge_x - 15, gauge_h)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, self.title)

        # Subtitle (below title if exists)
        if self.subtitle:
            painter.setFont(QFont("Arial", 8))
            painter.setPen(QPen(QColor(180, 180, 180)))
            subtitle_rect = QRect(5, gauge_y + gauge_h, gauge_x - 15, 20)
            painter.drawText(subtitle_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignTop, self.subtitle)

        # Value (right side)
        value_text = f"{self._display_value:.1f}{self.unit}"
        painter.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        painter.setPen(QPen(colors["glow"]))

        value_rect = QRect(gauge_x + gauge_w + 10, gauge_y, 50, gauge_h)
        painter.drawText(value_rect, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, value_text)


class AnimatedCircularGauge(QWidget):
    """
    Animated circular gauge with arc fill and glow effects
    """

    def __init__(self,
                 title: str = "Metric",
                 min_value: float = 0,
                 max_value: float = 100,
                 unit: str = "%",
                 color_scheme: str = "cyan",
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.min_value = min_value
        self.max_value = max_value
        self.unit = unit
        self.color_scheme = color_scheme

        self._current_value = min_value
        self._target_value = min_value
        self._display_value = min_value

        self._rotation_phase = 0.0
        self._glow_phase = 0.0

        # Color schemes
        self.color_schemes = {
            "cyan": {
                "primary": QColor(0, 255, 255),
                "secondary": QColor(0, 180, 200),
                "glow": QColor(100, 255, 255),
                "bg": QColor(20, 40, 50),
            },
            "orange": {
                "primary": QColor(255, 165, 0),
                "secondary": QColor(200, 120, 0),
                "glow": QColor(255, 200, 100),
                "bg": QColor(50, 35, 20),
            },
            "green": {
                "primary": QColor(0, 255, 100),
                "secondary": QColor(0, 180, 80),
                "glow": QColor(100, 255, 150),
                "bg": QColor(20, 50, 30),
            },
            "red": {
                "primary": QColor(255, 50, 50),
                "secondary": QColor(200, 30, 30),
                "glow": QColor(255, 100, 100),
                "bg": QColor(50, 20, 20),
            },
            "purple": {
                "primary": QColor(200, 100, 255),
                "secondary": QColor(150, 50, 200),
                "glow": QColor(220, 150, 255),
                "bg": QColor(40, 20, 60),
            },
        }

        self.setMinimumSize(180, 200)

        # Animation timers
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_value)
        self.value_timer.start(16)

    def setValue(self, value: float):
        self._target_value = max(self.min_value, min(self.max_value, value))

    def value(self) -> float:
        return self._current_value

    def _animate(self):
        self._rotation_phase += 0.02
        self._glow_phase += 0.05

        if self._rotation_phase > 2 * math.pi:
            self._rotation_phase -= 2 * math.pi
        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi

        self.update()

    def _animate_value(self):
        diff = self._target_value - self._display_value
        if abs(diff) > 0.01:
            self._display_value += diff * 0.08
            self._current_value = self._display_value

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        colors = self.color_schemes.get(self.color_scheme, self.color_schemes["cyan"])

        width = self.width()
        height = self.height()

        # Center and radius
        center_x = width / 2
        center_y = height / 2 - 10
        radius = min(width, height) / 2 - 30

        # Draw background circle
        self._draw_background(painter, center_x, center_y, radius, colors)

        # Draw tick marks
        self._draw_ticks(painter, center_x, center_y, radius, colors)

        # Draw arc fill
        percentage = (self._display_value - self.min_value) / (self.max_value - self.min_value)
        self._draw_arc_fill(painter, center_x, center_y, radius, percentage, colors)

        # Draw rotating elements
        self._draw_rotating_elements(painter, center_x, center_y, radius, colors)

        # Draw center
        self._draw_center(painter, center_x, center_y, radius, colors)

        # Draw labels
        self._draw_labels(painter, center_x, center_y, radius, colors)

    def _draw_background(self, painter, cx, cy, r, colors):
        """Draw gauge background"""
        # Outer ring
        painter.setPen(QPen(QColor(60, 60, 70), 3))
        painter.setBrush(QBrush(colors["bg"]))
        painter.drawEllipse(QPointF(cx, cy), r + 5, r + 5)

        # Inner dark area
        inner_gradient = QRadialGradient(cx, cy, r)
        inner_gradient.setColorAt(0, QColor(30, 30, 40))
        inner_gradient.setColorAt(0.7, QColor(20, 20, 30))
        inner_gradient.setColorAt(1, QColor(40, 40, 50))

        painter.setBrush(QBrush(inner_gradient))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QPointF(cx, cy), r - 5, r - 5)

    def _draw_ticks(self, painter, cx, cy, r, colors):
        """Draw tick marks around the gauge"""
        start_angle = 225  # degrees
        end_angle = -45
        total_angle = start_angle - end_angle

        num_major_ticks = 10
        num_minor_ticks = 50

        # Minor ticks
        painter.setPen(QPen(QColor(80, 80, 90), 1))
        for i in range(num_minor_ticks + 1):
            angle_deg = start_angle - (total_angle * i / num_minor_ticks)
            angle_rad = math.radians(angle_deg)

            inner_r = r - 15
            outer_r = r - 10

            x1 = cx + inner_r * math.cos(angle_rad)
            y1 = cy - inner_r * math.sin(angle_rad)
            x2 = cx + outer_r * math.cos(angle_rad)
            y2 = cy - outer_r * math.sin(angle_rad)

            painter.drawLine(QPointF(x1, y1), QPointF(x2, y2))

        # Major ticks
        painter.setPen(QPen(colors["primary"], 2))
        for i in range(num_major_ticks + 1):
            angle_deg = start_angle - (total_angle * i / num_major_ticks)
            angle_rad = math.radians(angle_deg)

            inner_r = r - 20
            outer_r = r - 8

            x1 = cx + inner_r * math.cos(angle_rad)
            y1 = cy - inner_r * math.sin(angle_rad)
            x2 = cx + outer_r * math.cos(angle_rad)
            y2 = cy - outer_r * math.sin(angle_rad)

            painter.drawLine(QPointF(x1, y1), QPointF(x2, y2))

    def _draw_arc_fill(self, painter, cx, cy, r, percentage, colors):
        """Draw the filled arc with glow"""
        if percentage <= 0:
            return

        start_angle = 225 * 16  # Qt uses 1/16th degrees
        span_angle = -int(270 * 16 * percentage)

        arc_rect = QRectF(cx - r + 8, cy - r + 8, (r - 8) * 2, (r - 8) * 2)

        # Glow intensity
        glow_intensity = 0.7 + 0.3 * math.sin(self._glow_phase)

        # Draw glow layers
        for i in range(4, 0, -1):
            glow_color = QColor(colors["glow"])
            glow_color.setAlpha(int(40 * glow_intensity * (5 - i) / 4))

            pen = QPen(glow_color, 12 + i * 4)
            pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            painter.setPen(pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawArc(arc_rect, start_angle, span_angle)

        # Main arc
        arc_gradient = QConicalGradient(cx, cy, 225)
        arc_gradient.setColorAt(0, colors["secondary"])
        arc_gradient.setColorAt(percentage * 0.75, colors["primary"])
        arc_gradient.setColorAt(percentage * 0.75, colors["glow"])

        pen = QPen(QBrush(arc_gradient), 12)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        painter.setPen(pen)
        painter.drawArc(arc_rect, start_angle, span_angle)

    def _draw_rotating_elements(self, painter, cx, cy, r, colors):
        """Draw rotating decorative elements"""
        # Rotating dots around the gauge
        num_dots = 8
        for i in range(num_dots):
            base_angle = (360 / num_dots) * i
            angle_rad = math.radians(base_angle + math.degrees(self._rotation_phase))

            dot_r = r + 12
            dot_x = cx + dot_r * math.cos(angle_rad)
            dot_y = cy - dot_r * math.sin(angle_rad)

            # Pulsing size
            size = 3 + math.sin(self._glow_phase + i) * 1

            dot_color = QColor(colors["primary"])
            dot_color.setAlpha(150)

            painter.setBrush(QBrush(dot_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(dot_x, dot_y), size, size)

    def _draw_center(self, painter, cx, cy, r, colors):
        """Draw center hub"""
        # Center circle with gradient
        center_gradient = QRadialGradient(cx, cy - 5, 25)
        center_gradient.setColorAt(0, QColor(80, 80, 90))
        center_gradient.setColorAt(0.5, QColor(50, 50, 60))
        center_gradient.setColorAt(1, QColor(30, 30, 40))

        painter.setBrush(QBrush(center_gradient))
        painter.setPen(QPen(QColor(100, 100, 110), 2))
        painter.drawEllipse(QPointF(cx, cy), 25, 25)

        # Inner glow
        glow_intensity = 0.5 + 0.5 * math.sin(self._glow_phase)
        inner_color = QColor(colors["primary"])
        inner_color.setAlpha(int(100 * glow_intensity))

        painter.setBrush(QBrush(inner_color))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QPointF(cx, cy), 15, 15)

    def _draw_labels(self, painter, cx, cy, r, colors):
        """Draw title and value"""
        # Value in center
        painter.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        painter.setPen(QPen(colors["glow"]))

        value_text = f"{self._display_value:.1f}"
        value_rect = QRectF(cx - 40, cy - 12, 80, 24)
        painter.drawText(value_rect, Qt.AlignmentFlag.AlignCenter, value_text)

        # Unit below value
        painter.setFont(QFont("Arial", 10))
        painter.setPen(QPen(QColor(180, 180, 190)))

        unit_rect = QRectF(cx - 30, cy + 10, 60, 16)
        painter.drawText(unit_rect, Qt.AlignmentFlag.AlignCenter, self.unit)

        # Title at bottom
        painter.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        painter.setPen(QPen(colors["primary"]))

        title_rect = QRectF(cx - 60, cy + r + 15, 120, 20)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


class AnimatedSpeedometer(QWidget):
    """
    Animated speedometer-style gauge with needle
    """

    def __init__(self,
                 title: str = "Speed",
                 min_value: float = 0,
                 max_value: float = 100,
                 unit: str = "TPS",
                 warning_threshold: float = 80,
                 critical_threshold: float = 95,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.min_value = min_value
        self.max_value = max_value
        self.unit = unit
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold

        self._current_value = min_value
        self._target_value = min_value
        self._display_value = min_value
        self._needle_angle = 0

        self._glow_phase = 0.0
        self._needle_oscillation = 0.0

        self.setMinimumSize(200, 220)

        # Animation timers
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_value)
        self.value_timer.start(16)

    def setValue(self, value: float):
        self._target_value = max(self.min_value, min(self.max_value, value))

    def value(self) -> float:
        return self._current_value

    def _animate(self):
        self._glow_phase += 0.05
        self._needle_oscillation += 0.1

        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi
        if self._needle_oscillation > 2 * math.pi:
            self._needle_oscillation -= 2 * math.pi

        self.update()

    def _animate_value(self):
        diff = self._target_value - self._display_value
        if abs(diff) > 0.01:
            self._display_value += diff * 0.1
            self._current_value = self._display_value

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        center_x = width / 2
        center_y = height / 2
        radius = min(width, height) / 2 - 25

        # Draw background
        self._draw_background(painter, center_x, center_y, radius)

        # Draw colored zones
        self._draw_zones(painter, center_x, center_y, radius)

        # Draw scale
        self._draw_scale(painter, center_x, center_y, radius)

        # Draw needle
        self._draw_needle(painter, center_x, center_y, radius)

        # Draw center cap
        self._draw_center_cap(painter, center_x, center_y)

        # Draw digital display
        self._draw_digital_display(painter, center_x, center_y, radius)

        # Draw title
        self._draw_title(painter, center_x, center_y, radius)

    def _draw_background(self, painter, cx, cy, r):
        """Draw gauge background"""
        # Outer ring gradient
        outer_gradient = QRadialGradient(cx, cy, r + 20)
        outer_gradient.setColorAt(0.8, QColor(40, 40, 50))
        outer_gradient.setColorAt(0.9, QColor(60, 60, 70))
        outer_gradient.setColorAt(1.0, QColor(30, 30, 40))

        painter.setBrush(QBrush(outer_gradient))
        painter.setPen(QPen(QColor(80, 80, 90), 3))
        painter.drawEllipse(QPointF(cx, cy), r + 15, r + 15)

        # Inner face
        inner_gradient = QRadialGradient(cx, cy - r/4, r)
        inner_gradient.setColorAt(0, QColor(50, 50, 60))
        inner_gradient.setColorAt(0.5, QColor(30, 30, 40))
        inner_gradient.setColorAt(1, QColor(20, 20, 30))

        painter.setBrush(QBrush(inner_gradient))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QPointF(cx, cy), r, r)

    def _draw_zones(self, painter, cx, cy, r):
        """Draw colored warning zones"""
        arc_rect = QRectF(cx - r + 10, cy - r + 10, (r - 10) * 2, (r - 10) * 2)

        # Calculate angles for thresholds
        total_range = self.max_value - self.min_value
        warning_pct = (self.warning_threshold - self.min_value) / total_range
        critical_pct = (self.critical_threshold - self.min_value) / total_range

        start_angle = 225
        total_angle = 270

        # Normal zone (green)
        normal_span = int(total_angle * warning_pct * 16)
        pen = QPen(QColor(50, 200, 100, 100), 15)
        pen.setCapStyle(Qt.PenCapStyle.FlatCap)
        painter.setPen(pen)
        painter.drawArc(arc_rect, start_angle * 16, -normal_span)

        # Warning zone (yellow)
        warning_span = int(total_angle * (critical_pct - warning_pct) * 16)
        pen = QPen(QColor(255, 200, 50, 100), 15)
        painter.setPen(pen)
        painter.drawArc(arc_rect, int((start_angle - total_angle * warning_pct) * 16), -warning_span)

        # Critical zone (red)
        critical_span = int(total_angle * (1 - critical_pct) * 16)
        pen = QPen(QColor(255, 80, 80, 100), 15)
        painter.setPen(pen)
        painter.drawArc(arc_rect, int((start_angle - total_angle * critical_pct) * 16), -critical_span)

    def _draw_scale(self, painter, cx, cy, r):
        """Draw scale markings and numbers"""
        start_angle = 225
        total_angle = 270
        num_major = 10
        num_minor = 50

        total_range = self.max_value - self.min_value

        # Minor ticks
        painter.setPen(QPen(QColor(100, 100, 110), 1))
        for i in range(num_minor + 1):
            angle_deg = start_angle - (total_angle * i / num_minor)
            angle_rad = math.radians(angle_deg)

            inner_r = r - 20
            outer_r = r - 12

            x1 = cx + inner_r * math.cos(angle_rad)
            y1 = cy - inner_r * math.sin(angle_rad)
            x2 = cx + outer_r * math.cos(angle_rad)
            y2 = cy - outer_r * math.sin(angle_rad)

            painter.drawLine(QPointF(x1, y1), QPointF(x2, y2))

        # Major ticks and numbers
        painter.setFont(QFont("Arial", 9, QFont.Weight.Bold))
        for i in range(num_major + 1):
            angle_deg = start_angle - (total_angle * i / num_major)
            angle_rad = math.radians(angle_deg)

            # Tick
            inner_r = r - 25
            outer_r = r - 10

            # Color based on zone
            value_at_tick = self.min_value + (total_range * i / num_major)
            if value_at_tick >= self.critical_threshold:
                tick_color = QColor(255, 100, 100)
            elif value_at_tick >= self.warning_threshold:
                tick_color = QColor(255, 200, 100)
            else:
                tick_color = QColor(100, 200, 150)

            painter.setPen(QPen(tick_color, 2))

            x1 = cx + inner_r * math.cos(angle_rad)
            y1 = cy - inner_r * math.sin(angle_rad)
            x2 = cx + outer_r * math.cos(angle_rad)
            y2 = cy - outer_r * math.sin(angle_rad)

            painter.drawLine(QPointF(x1, y1), QPointF(x2, y2))

            # Number
            text_r = r - 38
            text_x = cx + text_r * math.cos(angle_rad)
            text_y = cy - text_r * math.sin(angle_rad)

            painter.setPen(QPen(QColor(200, 200, 210)))
            text = str(int(value_at_tick))

            text_rect = QRectF(text_x - 15, text_y - 8, 30, 16)
            painter.drawText(text_rect, Qt.AlignmentFlag.AlignCenter, text)

    def _draw_needle(self, painter, cx, cy, r):
        """Draw animated needle"""
        # Calculate needle angle
        percentage = (self._display_value - self.min_value) / (self.max_value - self.min_value)
        target_angle = 225 - (270 * percentage)

        # Add slight oscillation for realism
        oscillation = math.sin(self._needle_oscillation) * 0.5 * (1 - percentage * 0.5)
        needle_angle = target_angle + oscillation

        angle_rad = math.radians(needle_angle)

        # Needle shadow
        shadow_offset = 3
        painter.setBrush(QBrush(QColor(0, 0, 0, 80)))
        painter.setPen(Qt.PenStyle.NoPen)

        shadow_points = [
            QPointF(cx + shadow_offset + (r - 25) * math.cos(angle_rad),
                   cy + shadow_offset - (r - 25) * math.sin(angle_rad)),
            QPointF(cx + shadow_offset + 8 * math.cos(angle_rad + math.pi/2),
                   cy + shadow_offset - 8 * math.sin(angle_rad + math.pi/2)),
            QPointF(cx + shadow_offset - 15 * math.cos(angle_rad),
                   cy + shadow_offset + 15 * math.sin(angle_rad)),
            QPointF(cx + shadow_offset + 8 * math.cos(angle_rad - math.pi/2),
                   cy + shadow_offset - 8 * math.sin(angle_rad - math.pi/2)),
        ]
        painter.drawPolygon(shadow_points)

        # Needle body
        needle_gradient = QLinearGradient(
            cx + (r - 25) * math.cos(angle_rad),
            cy - (r - 25) * math.sin(angle_rad),
            cx - 15 * math.cos(angle_rad),
            cy + 15 * math.sin(angle_rad)
        )

        # Color based on current value
        if self._display_value >= self.critical_threshold:
            needle_color = QColor(255, 80, 80)
        elif self._display_value >= self.warning_threshold:
            needle_color = QColor(255, 180, 50)
        else:
            needle_color = QColor(255, 100, 100)

        glow_intensity = 0.7 + 0.3 * math.sin(self._glow_phase)
        needle_color.setAlpha(int(255 * glow_intensity))

        needle_gradient.setColorAt(0, needle_color)
        needle_gradient.setColorAt(0.5, QColor(200, 200, 200))
        needle_gradient.setColorAt(1, QColor(100, 100, 100))

        painter.setBrush(QBrush(needle_gradient))
        painter.setPen(QPen(QColor(50, 50, 50), 1))

        needle_points = [
            QPointF(cx + (r - 25) * math.cos(angle_rad),
                   cy - (r - 25) * math.sin(angle_rad)),
            QPointF(cx + 6 * math.cos(angle_rad + math.pi/2),
                   cy - 6 * math.sin(angle_rad + math.pi/2)),
            QPointF(cx - 15 * math.cos(angle_rad),
                   cy + 15 * math.sin(angle_rad)),
            QPointF(cx + 6 * math.cos(angle_rad - math.pi/2),
                   cy - 6 * math.sin(angle_rad - math.pi/2)),
        ]
        painter.drawPolygon(needle_points)

    def _draw_center_cap(self, painter, cx, cy):
        """Draw center cap"""
        # Outer ring
        cap_gradient = QRadialGradient(cx, cy - 5, 20)
        cap_gradient.setColorAt(0, QColor(120, 120, 130))
        cap_gradient.setColorAt(0.5, QColor(80, 80, 90))
        cap_gradient.setColorAt(1, QColor(50, 50, 60))

        painter.setBrush(QBrush(cap_gradient))
        painter.setPen(QPen(QColor(60, 60, 70), 2))
        painter.drawEllipse(QPointF(cx, cy), 18, 18)

        # Inner highlight
        painter.setBrush(QBrush(QColor(100, 100, 110)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QPointF(cx, cy - 2), 8, 8)

    def _draw_digital_display(self, painter, cx, cy, r):
        """Draw digital value display"""
        display_rect = QRectF(cx - 35, cy + 25, 70, 25)

        # Display background
        painter.setBrush(QBrush(QColor(20, 20, 30)))
        painter.setPen(QPen(QColor(60, 60, 70), 1))
        painter.drawRoundedRect(display_rect, 5, 5)

        # Value text
        painter.setFont(QFont("Consolas", 14, QFont.Weight.Bold))

        # Color based on value
        if self._display_value >= self.critical_threshold:
            text_color = QColor(255, 80, 80)
        elif self._display_value >= self.warning_threshold:
            text_color = QColor(255, 200, 50)
        else:
            text_color = QColor(100, 255, 150)

        painter.setPen(QPen(text_color))
        painter.drawText(display_rect, Qt.AlignmentFlag.AlignCenter, f"{self._display_value:.1f}")

        # Unit
        painter.setFont(QFont("Arial", 8))
        painter.setPen(QPen(QColor(150, 150, 160)))
        unit_rect = QRectF(cx - 25, cy + 50, 50, 15)
        painter.drawText(unit_rect, Qt.AlignmentFlag.AlignCenter, self.unit)

    def _draw_title(self, painter, cx, cy, r):
        """Draw gauge title"""
        painter.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        painter.setPen(QPen(QColor(200, 200, 210)))

        title_rect = QRectF(cx - 60, cy + r + 5, 120, 20)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


# ============================================================================
# LIVE ANIMATED CHARTS
# ============================================================================

class LiveLineChart(QWidget):
    """
    Live animated line chart with smooth scrolling
    """

    def __init__(self,
                 title: str = "Live Data",
                 y_label: str = "Value",
                 max_points: int = 100,
                 line_color: QColor = None,
                 fill: bool = True,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.y_label = y_label
        self.max_points = max_points
        self.line_color = line_color or QColor(0, 200, 255)
        self.fill = fill

        # Data storage
        self.data = deque(maxlen=max_points)
        self.timestamps = deque(maxlen=max_points)

        # Animation
        self._scroll_offset = 0.0
        self._glow_phase = 0.0

        # Auto range
        self.y_min = 0
        self.y_max = 100
        self.auto_range = True

        self.setMinimumSize(400, 200)

        # Animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

    def addDataPoint(self, value: float, timestamp: datetime = None):
        """Add a new data point"""
        self.data.append(value)
        self.timestamps.append(timestamp or datetime.now())

        if self.auto_range and len(self.data) > 0:
            data_list = list(self.data)
            self.y_min = min(data_list) * 0.9
            self.y_max = max(data_list) * 1.1
            if self.y_min == self.y_max:
                self.y_max = self.y_min + 1

    def setRange(self, y_min: float, y_max: float):
        """Set fixed Y range"""
        self.y_min = y_min
        self.y_max = y_max
        self.auto_range = False

    def _animate(self):
        self._scroll_offset += 0.5
        self._glow_phase += 0.05

        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi

        self.update()

    def paintEvent(self, event):
        if len(self.data) < 2:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        # Margins
        margin_left = 60
        margin_right = 20
        margin_top = 40
        margin_bottom = 40

        chart_width = width - margin_left - margin_right
        chart_height = height - margin_top - margin_bottom

        # Draw background
        self._draw_background(painter, margin_left, margin_top, chart_width, chart_height)

        # Draw grid
        self._draw_grid(painter, margin_left, margin_top, chart_width, chart_height)

        # Draw data
        self._draw_data(painter, margin_left, margin_top, chart_width, chart_height)

        # Draw axes
        self._draw_axes(painter, margin_left, margin_top, chart_width, chart_height)

        # Draw title
        self._draw_title(painter, width)

    def _draw_background(self, painter, x, y, w, h):
        """Draw chart background"""
        bg_gradient = QLinearGradient(x, y, x, y + h)
        bg_gradient.setColorAt(0, QColor(25, 30, 40))
        bg_gradient.setColorAt(1, QColor(15, 20, 30))

        painter.setBrush(QBrush(bg_gradient))
        painter.setPen(QPen(QColor(60, 70, 80), 1))
        painter.drawRoundedRect(QRectF(x, y, w, h), 5, 5)

    def _draw_grid(self, painter, x, y, w, h):
        """Draw grid lines"""
        painter.setPen(QPen(QColor(50, 60, 70), 1, Qt.PenStyle.DotLine))

        # Horizontal grid lines
        num_h_lines = 5
        for i in range(num_h_lines + 1):
            line_y = y + (h * i / num_h_lines)
            painter.drawLine(QPointF(x, line_y), QPointF(x + w, line_y))

        # Vertical grid lines
        num_v_lines = 10
        for i in range(num_v_lines + 1):
            line_x = x + (w * i / num_v_lines)
            painter.drawLine(QPointF(line_x, y), QPointF(line_x, y + h))

    def _draw_data(self, painter, x, y, w, h):
        """Draw the data line with glow effect"""
        if len(self.data) < 2:
            return

        data_list = list(self.data)
        num_points = len(data_list)

        # Create path
        path = QPainterPath()
        points = []

        for i, value in enumerate(data_list):
            px = x + (w * i / (num_points - 1))
            py = y + h - (h * (value - self.y_min) / (self.y_max - self.y_min))
            py = max(y, min(y + h, py))
            points.append(QPointF(px, py))

        path.moveTo(points[0])
        for point in points[1:]:
            path.lineTo(point)

        # Draw glow layers
        glow_intensity = 0.6 + 0.4 * math.sin(self._glow_phase)

        for i in range(4, 0, -1):
            glow_color = QColor(self.line_color)
            glow_color.setAlpha(int(30 * glow_intensity * (5 - i) / 4))

            pen = QPen(glow_color, 2 + i * 2)
            pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
            painter.setPen(pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawPath(path)

        # Draw main line
        pen = QPen(self.line_color, 2)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
        painter.setPen(pen)
        painter.drawPath(path)

        # Fill area under curve
        if self.fill:
            fill_path = QPainterPath(path)
            fill_path.lineTo(points[-1].x(), y + h)
            fill_path.lineTo(points[0].x(), y + h)
            fill_path.closeSubpath()

            fill_gradient = QLinearGradient(x, y, x, y + h)
            fill_color = QColor(self.line_color)
            fill_color.setAlpha(int(80 * glow_intensity))
            fill_gradient.setColorAt(0, fill_color)
            fill_color.setAlpha(0)
            fill_gradient.setColorAt(1, fill_color)

            painter.setBrush(QBrush(fill_gradient))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawPath(fill_path)

        # Draw data points
        painter.setBrush(QBrush(self.line_color))
        painter.setPen(QPen(QColor(255, 255, 255), 1))

        # Only draw every nth point to avoid clutter
        step = max(1, num_points // 20)
        for i, point in enumerate(points):
            if i % step == 0 or i == len(points) - 1:
                painter.drawEllipse(point, 4, 4)

        # Highlight last point
        if points:
            last_point = points[-1]

            # Animated pulse
            pulse_size = 6 + 3 * math.sin(self._glow_phase * 2)

            pulse_color = QColor(self.line_color)
            pulse_color.setAlpha(100)
            painter.setBrush(QBrush(pulse_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(last_point, pulse_size + 4, pulse_size + 4)

            painter.setBrush(QBrush(self.line_color))
            painter.setPen(QPen(QColor(255, 255, 255), 2))
            painter.drawEllipse(last_point, pulse_size, pulse_size)

            # Value label
            painter.setFont(QFont("Arial", 10, QFont.Weight.Bold))
            painter.setPen(QPen(self.line_color))

            value_text = f"{data_list[-1]:.1f}"
            label_rect = QRectF(last_point.x() + 10, last_point.y() - 20, 60, 20)

            # Background for label
            painter.setBrush(QBrush(QColor(30, 35, 45, 200)))
            painter.setPen(QPen(self.line_color, 1))
            painter.drawRoundedRect(label_rect, 3, 3)

            painter.setPen(QPen(self.line_color))
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignCenter, value_text)

    def _draw_axes(self, painter, x, y, w, h):
        """Draw axes and labels"""
        painter.setPen(QPen(QColor(150, 160, 170), 1))

        # Y-axis labels
        painter.setFont(QFont("Arial", 9))
        num_labels = 5
        for i in range(num_labels + 1):
            label_y = y + (h * i / num_labels)
            value = self.y_max - (self.y_max - self.y_min) * i / num_labels

            label_rect = QRectF(5, label_y - 8, x - 10, 16)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter,
                           f"{value:.1f}")

        # Y-axis label (rotated)
        painter.save()
        painter.translate(15, y + h/2)
        painter.rotate(-90)
        painter.drawText(QRectF(-h/2, -10, h, 20), Qt.AlignmentFlag.AlignCenter, self.y_label)
        painter.restore()

    def _draw_title(self, painter, width):
        """Draw chart title"""
        painter.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        painter.setPen(QPen(QColor(200, 210, 220)))

        title_rect = QRectF(0, 5, width, 30)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


class LiveCandlestickChart(QWidget):
    """
    Live animated candlestick chart for financial data
    """

    def __init__(self,
                 title: str = "Price Chart",
                 max_candles: int = 50,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.max_candles = max_candles

        # Data storage (open, high, low, close, timestamp)
        self.candles = deque(maxlen=max_candles)

        # Current forming candle
        self.current_candle = None

        # Animation
        self._glow_phase = 0.0

        # Colors
        self.bull_color = QColor(50, 200, 100)
        self.bear_color = QColor(255, 80, 80)

        self.setMinimumSize(500, 300)

        # Animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

    def addCandle(self, open_price: float, high: float, low: float, close: float,
                  timestamp: datetime = None):
        """Add a completed candle"""
        self.candles.append({
            'open': open_price,
            'high': high,
            'low': low,
            'close': close,
            'timestamp': timestamp or datetime.now()
        })

    def updateCurrentCandle(self, open_price: float, high: float, low: float, close: float):
        """Update the current forming candle"""
        self.current_candle = {
            'open': open_price,
            'high': high,
            'low': low,
            'close': close,
            'timestamp': datetime.now()
        }

    def _animate(self):
        self._glow_phase += 0.05
        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        # Margins
        margin_left = 70
        margin_right = 20
        margin_top = 50
        margin_bottom = 40

        chart_width = width - margin_left - margin_right
        chart_height = height - margin_top - margin_bottom

        # Draw background
        self._draw_background(painter, margin_left, margin_top, chart_width, chart_height)

        # Get all candles including current
        all_candles = list(self.candles)
        if self.current_candle:
            all_candles.append(self.current_candle)

        if not all_candles:
            return

        # Calculate price range
        all_prices = []
        for c in all_candles:
            all_prices.extend([c['high'], c['low']])

        price_min = min(all_prices) * 0.999
        price_max = max(all_prices) * 1.001

        # Draw grid
        self._draw_grid(painter, margin_left, margin_top, chart_width, chart_height,
                       price_min, price_max)

        # Draw candles
        self._draw_candles(painter, margin_left, margin_top, chart_width, chart_height,
                          all_candles, price_min, price_max)

        # Draw title
        self._draw_title(painter, width)

    def _draw_background(self, painter, x, y, w, h):
        """Draw chart background"""
        bg_gradient = QLinearGradient(x, y, x, y + h)
        bg_gradient.setColorAt(0, QColor(20, 25, 35))
        bg_gradient.setColorAt(1, QColor(10, 15, 25))

        painter.setBrush(QBrush(bg_gradient))
        painter.setPen(QPen(QColor(50, 60, 70), 1))
        painter.drawRoundedRect(QRectF(x, y, w, h), 5, 5)

    def _draw_grid(self, painter, x, y, w, h, price_min, price_max):
        """Draw price grid"""
        painter.setPen(QPen(QColor(40, 50, 60), 1, Qt.PenStyle.DotLine))

        # Horizontal lines and price labels
        num_lines = 6
        painter.setFont(QFont("Consolas", 9))

        for i in range(num_lines + 1):
            line_y = y + (h * i / num_lines)
            painter.drawLine(QPointF(x, line_y), QPointF(x + w, line_y))

            price = price_max - (price_max - price_min) * i / num_lines

            painter.setPen(QPen(QColor(150, 160, 170)))
            label_rect = QRectF(5, line_y - 8, x - 10, 16)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter,
                           f"{price:.2f}")
            painter.setPen(QPen(QColor(40, 50, 60), 1, Qt.PenStyle.DotLine))

    def _draw_candles(self, painter, x, y, w, h, candles, price_min, price_max):
        """Draw candlesticks"""
        if not candles:
            return

        num_candles = len(candles)
        candle_width = max(3, (w / num_candles) * 0.7)
        spacing = w / num_candles

        price_range = price_max - price_min

        for i, candle in enumerate(candles):
            cx = x + spacing * i + spacing / 2

            # Calculate positions
            open_y = y + h * (1 - (candle['open'] - price_min) / price_range)
            close_y = y + h * (1 - (candle['close'] - price_min) / price_range)
            high_y = y + h * (1 - (candle['high'] - price_min) / price_range)
            low_y = y + h * (1 - (candle['low'] - price_min) / price_range)

            # Determine if bullish or bearish
            is_bullish = candle['close'] >= candle['open']
            color = self.bull_color if is_bullish else self.bear_color

            # Is this the current candle?
            is_current = (i == num_candles - 1 and self.current_candle is not None)

            if is_current:
                # Animated glow for current candle
                glow_intensity = 0.5 + 0.5 * math.sin(self._glow_phase * 2)

                # Draw glow
                glow_color = QColor(color)
                glow_color.setAlpha(int(100 * glow_intensity))
                painter.setBrush(QBrush(glow_color))
                painter.setPen(Qt.PenStyle.NoPen)

                body_top = min(open_y, close_y)
                body_height = abs(close_y - open_y)

                glow_rect = QRectF(cx - candle_width/2 - 4, body_top - 4,
                                  candle_width + 8, body_height + 8)
                painter.drawRoundedRect(glow_rect, 3, 3)

            # Draw wick
            painter.setPen(QPen(color, 1))
            painter.drawLine(QPointF(cx, high_y), QPointF(cx, low_y))

            # Draw body
            body_top = min(open_y, close_y)
            body_height = max(1, abs(close_y - open_y))

            if is_bullish:
                painter.setBrush(QBrush(color))
            else:
                painter.setBrush(QBrush(color))

            painter.setPen(QPen(color.darker(120), 1))

            body_rect = QRectF(cx - candle_width/2, body_top, candle_width, body_height)
            painter.drawRect(body_rect)

    def _draw_title(self, painter, width):
        """Draw chart title"""
        painter.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        painter.setPen(QPen(QColor(200, 210, 220)))

        title_rect = QRectF(0, 10, width, 30)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


class LiveBarChart(QWidget):
    """
    Animated bar chart with smooth transitions
    """

    def __init__(self,
                 title: str = "Bar Chart",
                 categories: list = None,
                 colors: list = None,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.categories = categories or []
        self.colors = colors or [
            QColor(100, 200, 255),
            QColor(255, 150, 100),
            QColor(100, 255, 150),
            QColor(255, 100, 150),
            QColor(200, 150, 255),
        ]

        # Current and target values for animation
        self._values = {}
        self._target_values = {}
        self._display_values = {}

        # Animation
        self._glow_phase = 0.0

        self.setMinimumSize(400, 250)

        # Animation timers
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_values)
        self.value_timer.start(16)

    def setCategories(self, categories: list):
        """Set category labels"""
        self.categories = categories
        for cat in categories:
            if cat not in self._values:
                self._values[cat] = 0
                self._target_values[cat] = 0
                self._display_values[cat] = 0

    def setValue(self, category: str, value: float):
        """Set value for a category with animation"""
        if category not in self.categories:
            self.categories.append(category)

        self._target_values[category] = value
        if category not in self._display_values:
            self._display_values[category] = 0

    def setValues(self, values: dict):
        """Set multiple values"""
        for category, value in values.items():
            self.setValue(category, value)

    def _animate(self):
        self._glow_phase += 0.03
        if self._glow_phase > 2 * math.pi:
            self._glow_phase -= 2 * math.pi
        self.update()

    def _animate_values(self):
        for category in self._target_values:
            if category in self._display_values:
                diff = self._target_values[category] - self._display_values[category]
                if abs(diff) > 0.1:
                    self._display_values[category] += diff * 0.1
                    self._values[category] = self._display_values[category]

    def paintEvent(self, event):
        if not self.categories:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        # Margins
        margin_left = 60
        margin_right = 20
        margin_top = 50
        margin_bottom = 60

        chart_width = width - margin_left - margin_right
        chart_height = height - margin_top - margin_bottom

        # Draw background
        self._draw_background(painter, margin_left, margin_top, chart_width, chart_height)

        # Calculate max value
        max_value = max([self._display_values.get(c, 0) for c in self.categories] + [1])

        # Draw grid
        self._draw_grid(painter, margin_left, margin_top, chart_width, chart_height, max_value)

        # Draw bars
        self._draw_bars(painter, margin_left, margin_top, chart_width, chart_height, max_value)

        # Draw title
        self._draw_title(painter, width)

    def _draw_background(self, painter, x, y, w, h):
        """Draw chart background"""
        bg_gradient = QLinearGradient(x, y, x, y + h)
        bg_gradient.setColorAt(0, QColor(25, 30, 40))
        bg_gradient.setColorAt(1, QColor(15, 20, 30))

        painter.setBrush(QBrush(bg_gradient))
        painter.setPen(QPen(QColor(60, 70, 80), 1))
        painter.drawRoundedRect(QRectF(x, y, w, h), 5, 5)

    def _draw_grid(self, painter, x, y, w, h, max_value):
        """Draw horizontal grid lines"""
        painter.setPen(QPen(QColor(50, 60, 70), 1, Qt.PenStyle.DotLine))
        painter.setFont(QFont("Arial", 9))

        num_lines = 5
        for i in range(num_lines + 1):
            line_y = y + h - (h * i / num_lines)
            painter.drawLine(QPointF(x, line_y), QPointF(x + w, line_y))

            value = max_value * i / num_lines
            painter.setPen(QPen(QColor(150, 160, 170)))
            label_rect = QRectF(5, line_y - 8, x - 10, 16)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter,
                           f"{value:.0f}")
            painter.setPen(QPen(QColor(50, 60, 70), 1, Qt.PenStyle.DotLine))

    def _draw_bars(self, painter, x, y, w, h, max_value):
        """Draw animated bars"""
        num_bars = len(self.categories)
        if num_bars == 0:
            return

        bar_width = (w / num_bars) * 0.6
        spacing = w / num_bars

        for i, category in enumerate(self.categories):
            value = self._display_values.get(category, 0)
            bar_height = (value / max_value) * h if max_value > 0 else 0

            bar_x = x + spacing * i + (spacing - bar_width) / 2
            bar_y = y + h - bar_height

            color = self.colors[i % len(self.colors)]

            # Glow effect
            glow_intensity = 0.6 + 0.4 * math.sin(self._glow_phase + i * 0.5)

            # Draw glow
            for j in range(3, 0, -1):
                glow_color = QColor(color)
                glow_color.setAlpha(int(40 * glow_intensity * (4 - j) / 3))

                painter.setBrush(QBrush(glow_color))
                painter.setPen(Qt.PenStyle.NoPen)

                glow_rect = QRectF(bar_x - j * 2, bar_y - j * 2,
                                  bar_width + j * 4, bar_height + j * 2)
                painter.drawRoundedRect(glow_rect, 4, 4)

            # Draw bar
            bar_gradient = QLinearGradient(bar_x, bar_y, bar_x + bar_width, bar_y)
            bar_gradient.setColorAt(0, color.lighter(120))
            bar_gradient.setColorAt(0.5, color)
            bar_gradient.setColorAt(1, color.darker(110))

            painter.setBrush(QBrush(bar_gradient))
            painter.setPen(QPen(color.darker(130), 1))

            bar_rect = QRectF(bar_x, bar_y, bar_width, bar_height)
            painter.drawRoundedRect(bar_rect, 3, 3)

            # Value on top
            painter.setFont(QFont("Arial", 10, QFont.Weight.Bold))
            painter.setPen(QPen(color))

            value_rect = QRectF(bar_x - 10, bar_y - 25, bar_width + 20, 20)
            painter.drawText(value_rect, Qt.AlignmentFlag.AlignCenter, f"{value:.1f}")

            # Category label
            painter.setFont(QFont("Arial", 9))
            painter.setPen(QPen(QColor(180, 190, 200)))

            label_rect = QRectF(bar_x - 10, y + h + 10, bar_width + 20, 30)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignTop,
                           category)

    def _draw_title(self, painter, width):
        """Draw chart title"""
        painter.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        painter.setPen(QPen(QColor(200, 210, 220)))

        title_rect = QRectF(0, 10, width, 30)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


# ============================================================================
# MAIN DASHBOARD WINDOW
# ============================================================================

class AnimatedGaugeDashboard(QMainWindow):
    """
    Main dashboard window with animated gauges and live charts
    """

    def __init__(self):
        super().__init__()

        self.setWindowTitle("Animated Trading Dashboard")
        self.setGeometry(100, 100, 1600, 900)

        # Set dark theme
        self.setStyleSheet("""
            QMainWindow {
                background-color: #0a0e14;
            }
            QWidget {
                background-color: #0a0e14;
                color: #e0e0e0;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #2a3040;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 10px;
                background-color: #12161c;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 5px;
                color: #00d4ff;
            }
            QScrollArea {
                border: none;
                background-color: transparent;
            }
        """)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(15)
        main_layout.setContentsMargins(15, 15, 15, 15)

        # Title
        title_label = QLabel("📊 ANIMATED TRADING DASHBOARD")
        title_label.setStyleSheet("""
            font-size: 24px;
            font-weight: bold;
            color: #00d4ff;
            padding: 10px;
        """)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main_layout.addWidget(title_label)

        # Create scroll area for content
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setSpacing(20)

        # === PILL GAUGES SECTION ===
        gauges_group = QGroupBox("⚡ Core Metrics")
        gauges_layout = QVBoxLayout(gauges_group)

        # Create pill gauges
        self.pnl_gauge = AnimatedPillGauge(
            title="P&L",
            subtitle="Profit & Loss",
            min_value=-10000,
            max_value=10000,
            unit="$",
            color_scheme="gold"
        )

        self.win_rate_gauge = AnimatedPillGauge(
            title="Win Rate",
            subtitle="Success Rate",
            min_value=0,
            max_value=100,
            unit="%",
            color_scheme="green"
        )

        self.risk_gauge = AnimatedPillGauge(
            title="Risk Level",
            subtitle="Portfolio Risk",
            min_value=0,
            max_value=100,
            unit="%",
            color_scheme="red"
        )

        self.latency_gauge = AnimatedPillGauge(
            title="Latency",
            subtitle="System Delay",
            min_value=0,
            max_value=200,
            unit="ms",
            color_scheme="blue"
        )

        self.throughput_gauge = AnimatedPillGauge(
            title="Throughput",
            subtitle="Transaction Rate",
            min_value=0,
            max_value=1000,
            unit=" TPS",
            color_scheme="cyan"
        )

        gauges_layout.addWidget(self.pnl_gauge)
        gauges_layout.addWidget(self.win_rate_gauge)
        gauges_layout.addWidget(self.risk_gauge)
        gauges_layout.addWidget(self.latency_gauge)
        gauges_layout.addWidget(self.throughput_gauge)

        content_layout.addWidget(gauges_group)

        # === CIRCULAR GAUGES SECTION ===
        circular_group = QGroupBox("🎯 Performance Indicators")
        circular_layout = QHBoxLayout(circular_group)

        self.cpu_gauge = AnimatedCircularGauge(
            title="CPU Usage",
            min_value=0,
            max_value=100,
            unit="%",
            color_scheme="cyan"
        )

        self.memory_gauge = AnimatedCircularGauge(
            title="Memory",
            min_value=0,
            max_value=100,
            unit="%",
            color_scheme="orange"
        )

        self.network_gauge = AnimatedCircularGauge(
            title="Network",
            min_value=0,
            max_value=100,
            unit="Mbps",
            color_scheme="green"
        )

        self.accuracy_gauge = AnimatedCircularGauge(
            title="Accuracy",
            min_value=0,
            max_value=100,
            unit="%",
            color_scheme="purple"
        )

        circular_layout.addWidget(self.cpu_gauge)
        circular_layout.addWidget(self.memory_gauge)
        circular_layout.addWidget(self.network_gauge)
        circular_layout.addWidget(self.accuracy_gauge)

        content_layout.addWidget(circular_group)

        # === SPEEDOMETERS SECTION ===
        speed_group = QGroupBox("🚀 System Metrics")
        speed_layout = QHBoxLayout(speed_group)

        self.speed_gauge = AnimatedSpeedometer(
            title="Order Rate",
            min_value=0,
            max_value=500,
            unit="OPS",
            warning_threshold=350,
            critical_threshold=450
        )

        self.load_gauge = AnimatedSpeedometer(
            title="System Load",
            min_value=0,
            max_value=100,
            unit="%",
            warning_threshold=70,
            critical_threshold=90
        )

        speed_layout.addWidget(self.speed_gauge)
        speed_layout.addWidget(self.load_gauge)

        content_layout.addWidget(speed_group)

        # === LIVE CHARTS SECTION ===
        charts_group = QGroupBox("📈 Live Charts")
        charts_layout = QVBoxLayout(charts_group)

        # Row 1: Line and Candlestick
        row1_layout = QHBoxLayout()

        self.pnl_chart = LiveLineChart(
            title="Real-Time P&L",
            y_label="P&L ($)",
            max_points=100,
            line_color=QColor(0, 255, 200),
            fill=True
        )

        self.price_chart = LiveCandlestickChart(
            title="BTC/USD",
            max_candles=50
        )

        row1_layout.addWidget(self.pnl_chart)
        row1_layout.addWidget(self.price_chart)

        charts_layout.addLayout(row1_layout)

        # Row 2: Bar and another line chart
        row2_layout = QHBoxLayout()

        self.volume_chart = LiveBarChart(
            title="Trading Volume by Asset",
            categories=["BTC", "ETH", "SOL", "ADA", "DOT"],
            colors=[
                QColor(247, 147, 26),  # BTC orange
                QColor(98, 126, 234),   # ETH blue
                QColor(0, 255, 163),    # SOL green
                QColor(0, 51, 173),     # ADA blue
                QColor(230, 0, 122),    # DOT pink
            ]
        )

        self.latency_chart = LiveLineChart(
            title="System Latency",
            y_label="ms",
            max_points=100,
            line_color=QColor(255, 100, 100),
            fill=True
        )

        row2_layout.addWidget(self.volume_chart)
        row2_layout.addWidget(self.latency_chart)

        charts_layout.addLayout(row2_layout)

        content_layout.addWidget(charts_group)

        scroll.setWidget(content_widget)
        main_layout.addWidget(scroll)

        # Start data simulation
        self.start_data_simulation()

    def start_data_simulation(self):
        """Start simulating data updates"""
        # Gauge update timer
        self.gauge_timer = QTimer(self)
        self.gauge_timer.timeout.connect(self.update_gauges)
        self.gauge_timer.start(100)  # 10 Hz

        # Chart update timer
        self.chart_timer = QTimer(self)
        self.chart_timer.timeout.connect(self.update_charts)
        self.chart_timer.start(500)  # 2 Hz

        # Candlestick update timer
        self.candle_timer = QTimer(self)
        self.candle_timer.timeout.connect(self.update_candles)
        self.candle_timer.start(2000)  # Every 2 seconds

        # Initialize candle data
        self.current_price = 50000
        self.candle_open = self.current_price
        self.candle_high = self.current_price
        self.candle_low = self.current_price

    def update_gauges(self):
        """Update gauge values with simulated data"""
        # Smooth random walks for realistic data
        self.pnl_gauge.setValue(self.pnl_gauge.value() + random.uniform(-100, 120))
        self.win_rate_gauge.setValue(max(40, min(80, self.win_rate_gauge.value() + random.uniform(-0.5, 0.5))))
        self.risk_gauge.setValue(max(10, min(60, self.risk_gauge.value() + random.uniform(-1, 1))))
        self.latency_gauge.setValue(max(10, min(150, self.latency_gauge.value() + random.uniform(-5, 5))))
        self.throughput_gauge.setValue(max(100, min(800, self.throughput_gauge.value() + random.uniform(-20, 20))))

        # Circular gauges
        self.cpu_gauge.setValue(max(10, min(90, self.cpu_gauge.value() + random.uniform(-3, 3))))
        self.memory_gauge.setValue(max(30, min(80, self.memory_gauge.value() + random.uniform(-1, 1))))
        self.network_gauge.setValue(max(20, min(95, self.network_gauge.value() + random.uniform(-5, 5))))
        self.accuracy_gauge.setValue(max(60, min(99, self.accuracy_gauge.value() + random.uniform(-0.5, 0.5))))

        # Speedometers
        self.speed_gauge.setValue(max(50, min(480, self.speed_gauge.value() + random.uniform(-20, 20))))
        self.load_gauge.setValue(max(20, min(95, self.load_gauge.value() + random.uniform(-3, 3))))

    def update_charts(self):
        """Update chart data"""
        # P&L chart
        self.pnl_chart.addDataPoint(self.pnl_gauge.value())

        # Latency chart
        self.latency_chart.addDataPoint(self.latency_gauge.value())

        # Volume bar chart
        self.volume_chart.setValues({
            "BTC": random.uniform(500, 1500),
            "ETH": random.uniform(300, 1000),
            "SOL": random.uniform(200, 800),
            "ADA": random.uniform(100, 500),
            "DOT": random.uniform(150, 600),
        })

        # Update current candle
        price_change = random.uniform(-100, 100)
        self.current_price += price_change
        self.candle_high = max(self.candle_high, self.current_price)
        self.candle_low = min(self.candle_low, self.current_price)

        self.price_chart.updateCurrentCandle(
            self.candle_open,
            self.candle_high,
            self.candle_low,
            self.current_price
        )

    def update_candles(self):
        """Complete a candle and start a new one"""
        # Complete current candle
        self.price_chart.addCandle(
            self.candle_open,
            self.candle_high,
            self.candle_low,
            self.current_price
        )

        # Start new candle
        self.candle_open = self.current_price
        self.candle_high = self.current_price
        self.candle_low = self.current_price


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    app = QApplication(sys.argv)

    # Set application style
    app.setStyle('Fusion')

    # Create and show dashboard
    dashboard = AnimatedGaugeDashboard()
    dashboard.show()

    print("🚀 Animated Gauge Dashboard Started")
    print("   - Pill gauges with glowing effects")
    print("   - Circular gauges with rotating elements")
    print("   - Speedometer gauges with animated needles")
    print("   - Live line charts with smooth animation")
    print("   - Live candlestick charts")
    print("   - Animated bar charts")

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
