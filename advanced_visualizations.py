"""
ADVANCED ANIMATED VISUALIZATIONS
Enhanced charts and gauges with sophisticated animations
Including radar charts, heatmaps, and particle effects
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
# ANIMATED RADAR CHART
# ============================================================================

class AnimatedRadarChart(QWidget):
    """
    Animated radar/spider chart for multi-dimensional data
    """

    def __init__(self,
                 title: str = "Performance Radar",
                 categories: list = None,
                 max_value: float = 100,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.categories = categories or ["Speed", "Power", "Defense", "Range", "Control"]
        self.max_value = max_value

        # Values for each category
        self._values = {cat: 0 for cat in self.categories}
        self._target_values = {cat: 0 for cat in self.categories}
        self._display_values = {cat: 0 for cat in self.categories}

        # Animation
        self._rotation_phase = 0.0
        self._pulse_phase = 0.0
        self._scan_angle = 0.0

        # Colors
        self.primary_color = QColor(0, 200, 255)
        self.secondary_color = QColor(255, 100, 150)
        self.grid_color = QColor(60, 70, 80)

        self.setMinimumSize(350, 350)

        # Animation timers
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_values)
        self.value_timer.start(16)

    def setValue(self, category: str, value: float):
        """Set value for a category"""
        if category in self._target_values:
            self._target_values[category] = max(0, min(self.max_value, value))

    def setValues(self, values: dict):
        """Set multiple values"""
        for category, value in values.items():
            self.setValue(category, value)

    def _animate(self):
        self._rotation_phase += 0.01
        self._pulse_phase += 0.05
        self._scan_angle += 2  # degrees

        if self._rotation_phase > 2 * math.pi:
            self._rotation_phase -= 2 * math.pi
        if self._pulse_phase > 2 * math.pi:
            self._pulse_phase -= 2 * math.pi
        if self._scan_angle >= 360:
            self._scan_angle -= 360

        self.update()

    def _animate_values(self):
        for category in self._target_values:
            diff = self._target_values[category] - self._display_values[category]
            if abs(diff) > 0.1:
                self._display_values[category] += diff * 0.08

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        center_x = width / 2
        center_y = height / 2 + 10
        radius = min(width, height) / 2 - 50

        # Draw background
        self._draw_background(painter, center_x, center_y, radius)

        # Draw grid
        self._draw_grid(painter, center_x, center_y, radius)

        # Draw axes and labels
        self._draw_axes(painter, center_x, center_y, radius)

        # Draw scan line
        self._draw_scan_line(painter, center_x, center_y, radius)

        # Draw data polygon
        self._draw_data(painter, center_x, center_y, radius)

        # Draw data points
        self._draw_data_points(painter, center_x, center_y, radius)

        # Draw title
        self._draw_title(painter, width)

    def _draw_background(self, painter, cx, cy, r):
        """Draw radar background"""
        # Outer glow
        for i in range(10, 0, -1):
            glow_color = QColor(self.primary_color)
            glow_color.setAlpha(int(10 * (11 - i) / 10))

            painter.setBrush(QBrush(glow_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(cx, cy), r + i * 3, r + i * 3)

        # Main background
        bg_gradient = QRadialGradient(cx, cy, r + 10)
        bg_gradient.setColorAt(0, QColor(20, 30, 40))
        bg_gradient.setColorAt(0.8, QColor(15, 20, 30))
        bg_gradient.setColorAt(1, QColor(30, 40, 50))

        painter.setBrush(QBrush(bg_gradient))
        painter.setPen(QPen(self.primary_color.darker(150), 2))
        painter.drawEllipse(QPointF(cx, cy), r + 5, r + 5)

    def _draw_grid(self, painter, cx, cy, r):
        """Draw concentric grid circles"""
        num_rings = 5

        for i in range(1, num_rings + 1):
            ring_r = r * i / num_rings

            # Grid ring
            pen = QPen(self.grid_color, 1)
            pen.setStyle(Qt.PenStyle.DotLine)
            painter.setPen(pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawEllipse(QPointF(cx, cy), ring_r, ring_r)

            # Value label
            painter.setFont(QFont("Arial", 8))
            painter.setPen(QPen(QColor(100, 110, 120)))
            value = int(self.max_value * i / num_rings)
            painter.drawText(QPointF(cx + 5, cy - ring_r + 12), str(value))

    def _draw_axes(self, painter, cx, cy, r):
        """Draw axes and category labels"""
        num_categories = len(self.categories)

        for i, category in enumerate(self.categories):
            angle = 2 * math.pi * i / num_categories - math.pi / 2
            angle += self._rotation_phase * 0.2  # Slight rotation

            # Axis line
            end_x = cx + r * math.cos(angle)
            end_y = cy + r * math.sin(angle)

            # Gradient line
            line_gradient = QLinearGradient(cx, cy, end_x, end_y)
            line_gradient.setColorAt(0, QColor(self.grid_color.red(), self.grid_color.green(),
                                              self.grid_color.blue(), 50))
            line_gradient.setColorAt(1, self.grid_color)

            painter.setPen(QPen(QBrush(line_gradient), 1))
            painter.drawLine(QPointF(cx, cy), QPointF(end_x, end_y))

            # Category label
            label_r = r + 25
            label_x = cx + label_r * math.cos(angle)
            label_y = cy + label_r * math.sin(angle)

            painter.setFont(QFont("Arial", 10, QFont.Weight.Bold))
            painter.setPen(QPen(self.primary_color))

            # Adjust text alignment based on position
            text_rect = QRectF(label_x - 40, label_y - 10, 80, 20)
            painter.drawText(text_rect, Qt.AlignmentFlag.AlignCenter, category)

    def _draw_scan_line(self, painter, cx, cy, r):
        """Draw rotating scan line effect"""
        angle_rad = math.radians(self._scan_angle)

        # Scan line
        end_x = cx + r * math.cos(angle_rad)
        end_y = cy + r * math.sin(angle_rad)

        # Gradient for scan effect
        scan_gradient = QLinearGradient(cx, cy, end_x, end_y)
        scan_color = QColor(self.primary_color)
        scan_gradient.setColorAt(0, QColor(scan_color.red(), scan_color.green(),
                                          scan_color.blue(), 0))
        scan_gradient.setColorAt(0.5, QColor(scan_color.red(), scan_color.green(),
                                            scan_color.blue(), 100))
        scan_gradient.setColorAt(1, QColor(scan_color.red(), scan_color.green(),
                                          scan_color.blue(), 200))

        painter.setPen(QPen(QBrush(scan_gradient), 2))
        painter.drawLine(QPointF(cx, cy), QPointF(end_x, end_y))

        # Trailing fade effect
        for i in range(20):
            trail_angle = math.radians(self._scan_angle - i * 2)
            trail_x = cx + r * math.cos(trail_angle)
            trail_y = cy + r * math.sin(trail_angle)

            trail_color = QColor(self.primary_color)
            trail_color.setAlpha(int(50 * (20 - i) / 20))

            painter.setPen(QPen(trail_color, 1))
            painter.drawLine(QPointF(cx, cy), QPointF(trail_x, trail_y))

    def _draw_data(self, painter, cx, cy, r):
        """Draw the data polygon"""
        num_categories = len(self.categories)
        points = []

        for i, category in enumerate(self.categories):
            angle = 2 * math.pi * i / num_categories - math.pi / 2
            angle += self._rotation_phase * 0.2

            value = self._display_values.get(category, 0)
            value_r = r * value / self.max_value

            point_x = cx + value_r * math.cos(angle)
            point_y = cy + value_r * math.sin(angle)
            points.append(QPointF(point_x, point_y))

        if len(points) < 3:
            return

        # Create polygon path
        path = QPainterPath()
        path.moveTo(points[0])
        for point in points[1:]:
            path.lineTo(point)
        path.closeSubpath()

        # Pulse effect
        pulse_intensity = 0.6 + 0.4 * math.sin(self._pulse_phase)

        # Glow layers
        for i in range(4, 0, -1):
            glow_color = QColor(self.primary_color)
            glow_color.setAlpha(int(30 * pulse_intensity * (5 - i) / 4))

            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.setPen(QPen(glow_color, i * 2))
            painter.drawPath(path)

        # Fill gradient
        fill_gradient = QRadialGradient(cx, cy, r)
        fill_color = QColor(self.primary_color)
        fill_color.setAlpha(int(80 * pulse_intensity))
        fill_gradient.setColorAt(0, fill_color)
        fill_color.setAlpha(int(40 * pulse_intensity))
        fill_gradient.setColorAt(1, fill_color)

        painter.setBrush(QBrush(fill_gradient))
        painter.setPen(QPen(self.primary_color, 2))
        painter.drawPath(path)

    def _draw_data_points(self, painter, cx, cy, r):
        """Draw animated data points"""
        num_categories = len(self.categories)

        for i, category in enumerate(self.categories):
            angle = 2 * math.pi * i / num_categories - math.pi / 2
            angle += self._rotation_phase * 0.2

            value = self._display_values.get(category, 0)
            value_r = r * value / self.max_value

            point_x = cx + value_r * math.cos(angle)
            point_y = cy + value_r * math.sin(angle)

            # Pulse size
            pulse_size = 5 + 2 * math.sin(self._pulse_phase + i)

            # Outer glow
            glow_color = QColor(self.primary_color)
            glow_color.setAlpha(100)
            painter.setBrush(QBrush(glow_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(point_x, point_y), pulse_size + 4, pulse_size + 4)

            # Main point
            painter.setBrush(QBrush(self.primary_color))
            painter.setPen(QPen(QColor(255, 255, 255), 2))
            painter.drawEllipse(QPointF(point_x, point_y), pulse_size, pulse_size)

            # Value label
            painter.setFont(QFont("Arial", 9, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(255, 255, 255)))

            label_offset = 15
            label_x = point_x + label_offset * math.cos(angle)
            label_y = point_y + label_offset * math.sin(angle)

            label_rect = QRectF(label_x - 20, label_y - 8, 40, 16)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignCenter, f"{value:.0f}")

    def _draw_title(self, painter, width):
        """Draw chart title"""
        painter.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        painter.setPen(QPen(self.primary_color))

        title_rect = QRectF(0, 10, width, 30)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


# ============================================================================
# ANIMATED HEATMAP
# ============================================================================

class AnimatedHeatmap(QWidget):
    """
    Animated heatmap with smooth color transitions
    """

    def __init__(self,
                 title: str = "System Heatmap",
                 rows: int = 10,
                 cols: int = 24,
                 row_labels: list = None,
                 col_labels: list = None,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.rows = rows
        self.cols = cols
        self.row_labels = row_labels or [f"R{i}" for i in range(rows)]
        self.col_labels = col_labels or [f"{i:02d}:00" for i in range(cols)]

        # Data matrix
        self._data = np.zeros((rows, cols))
        self._target_data = np.zeros((rows, cols))
        self._display_data = np.zeros((rows, cols))

        # Animation
        self._wave_phase = 0.0

        # Color map (blue to red)
        self.color_stops = [
            (0.0, QColor(20, 50, 100)),
            (0.25, QColor(50, 100, 200)),
            (0.5, QColor(100, 200, 100)),
            (0.75, QColor(255, 200, 50)),
            (1.0, QColor(255, 50, 50)),
        ]

        self.setMinimumSize(600, 300)

        # Animation timers
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        self.value_timer = QTimer(self)
        self.value_timer.timeout.connect(self._animate_values)
        self.value_timer.start(50)

    def setData(self, data: np.ndarray):
        """Set heatmap data"""
        self._target_data = np.clip(data, 0, 1)

    def setValue(self, row: int, col: int, value: float):
        """Set single cell value"""
        if 0 <= row < self.rows and 0 <= col < self.cols:
            self._target_data[row, col] = max(0, min(1, value))

    def _animate(self):
        self._wave_phase += 0.05
        if self._wave_phase > 2 * math.pi:
            self._wave_phase -= 2 * math.pi
        self.update()

    def _animate_values(self):
        diff = self._target_data - self._display_data
        mask = np.abs(diff) > 0.001
        self._display_data[mask] += diff[mask] * 0.1

    def _value_to_color(self, value: float) -> QColor:
        """Convert value to color using color map"""
        value = max(0, min(1, value))

        for i in range(len(self.color_stops) - 1):
            v1, c1 = self.color_stops[i]
            v2, c2 = self.color_stops[i + 1]

            if v1 <= value <= v2:
                t = (value - v1) / (v2 - v1)
                r = int(c1.red() + (c2.red() - c1.red()) * t)
                g = int(c1.green() + (c2.green() - c1.green()) * t)
                b = int(c1.blue() + (c2.blue() - c1.blue()) * t)
                return QColor(r, g, b)

        return self.color_stops[-1][1]

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        # Margins
        margin_left = 60
        margin_right = 20
        margin_top = 50
        margin_bottom = 40

        chart_width = width - margin_left - margin_right
        chart_height = height - margin_top - margin_bottom

        # Cell dimensions
        cell_width = chart_width / self.cols
        cell_height = chart_height / self.rows

        # Draw cells
        for row in range(self.rows):
            for col in range(self.cols):
                value = self._display_data[row, col]

                # Add wave effect
                wave_offset = math.sin(self._wave_phase + row * 0.3 + col * 0.2) * 0.05
                display_value = max(0, min(1, value + wave_offset))

                x = margin_left + col * cell_width
                y = margin_top + row * cell_height

                color = self._value_to_color(display_value)

                # Cell background
                painter.setBrush(QBrush(color))
                painter.setPen(QPen(QColor(30, 30, 40), 1))
                painter.drawRect(QRectF(x, y, cell_width, cell_height))

                # Highlight high values
                if value > 0.8:
                    glow_intensity = 0.5 + 0.5 * math.sin(self._wave_phase * 2 + row + col)
                    glow_color = QColor(255, 255, 255, int(50 * glow_intensity))
                    painter.setBrush(QBrush(glow_color))
                    painter.setPen(Qt.PenStyle.NoPen)
                    painter.drawRect(QRectF(x + 2, y + 2, cell_width - 4, cell_height - 4))

        # Draw row labels
        painter.setFont(QFont("Arial", 8))
        painter.setPen(QPen(QColor(180, 190, 200)))

        for row in range(self.rows):
            y = margin_top + row * cell_height + cell_height / 2
            label = self.row_labels[row] if row < len(self.row_labels) else ""
            label_rect = QRectF(5, y - 8, margin_left - 10, 16)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, label)

        # Draw column labels (every 4th)
        for col in range(0, self.cols, 4):
            x = margin_left + col * cell_width + cell_width / 2
            label = self.col_labels[col] if col < len(self.col_labels) else ""
            label_rect = QRectF(x - 25, margin_top + chart_height + 5, 50, 20)
            painter.drawText(label_rect, Qt.AlignmentFlag.AlignCenter, label)

        # Draw color scale
        self._draw_color_scale(painter, width - 30, margin_top, 15, chart_height)

        # Draw title
        painter.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        painter.setPen(QPen(QColor(200, 210, 220)))
        title_rect = QRectF(0, 10, width, 30)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)

    def _draw_color_scale(self, painter, x, y, w, h):
        """Draw color scale legend"""
        # Gradient bar
        gradient = QLinearGradient(x, y + h, x, y)
        for stop, color in self.color_stops:
            gradient.setColorAt(stop, color)

        painter.setBrush(QBrush(gradient))
        painter.setPen(QPen(QColor(100, 100, 110), 1))
        painter.drawRect(QRectF(x, y, w, h))

        # Labels
        painter.setFont(QFont("Arial", 8))
        painter.setPen(QPen(QColor(150, 160, 170)))

        labels = ["0%", "25%", "50%", "75%", "100%"]
        for i, label in enumerate(labels):
            label_y = y + h - (h * i / (len(labels) - 1))
            painter.drawText(QPointF(x + w + 5, label_y + 4), label)


# ============================================================================
# PARTICLE EFFECT BACKGROUND
# ============================================================================

class ParticleBackground(QWidget):
    """
    Animated particle background effect
    """

    def __init__(self, parent=None):
        super().__init__(parent)

        self.particles = []
        self.num_particles = 100

        # Initialize particles
        self._init_particles()

        # Connection lines settings
        self.connection_distance = 150
        self.show_connections = True

        # Animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

        # Make widget transparent to mouse events
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)

    def _init_particles(self):
        """Initialize particles with random positions and velocities"""
        for _ in range(self.num_particles):
            self.particles.append({
                'x': random.uniform(0, 1920),
                'y': random.uniform(0, 1080),
                'vx': random.uniform(-0.5, 0.5),
                'vy': random.uniform(-0.5, 0.5),
                'size': random.uniform(1, 3),
                'alpha': random.uniform(50, 150),
            })

    def _animate(self):
        """Update particle positions"""
        width = self.width() or 1920
        height = self.height() or 1080

        for p in self.particles:
            # Update position
            p['x'] += p['vx']
            p['y'] += p['vy']

            # Wrap around edges
            if p['x'] < 0:
                p['x'] = width
            elif p['x'] > width:
                p['x'] = 0

            if p['y'] < 0:
                p['y'] = height
            elif p['y'] > height:
                p['y'] = 0

        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Draw connections
        if self.show_connections:
            for i, p1 in enumerate(self.particles):
                for p2 in self.particles[i+1:]:
                    dx = p2['x'] - p1['x']
                    dy = p2['y'] - p1['y']
                    distance = math.sqrt(dx * dx + dy * dy)

                    if distance < self.connection_distance:
                        alpha = int(50 * (1 - distance / self.connection_distance))
                        line_color = QColor(0, 200, 255, alpha)

                        painter.setPen(QPen(line_color, 1))
                        painter.drawLine(QPointF(p1['x'], p1['y']),
                                        QPointF(p2['x'], p2['y']))

        # Draw particles
        for p in self.particles:
            color = QColor(0, 200, 255, int(p['alpha']))
            painter.setBrush(QBrush(color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(p['x'], p['y']), p['size'], p['size'])


# ============================================================================
# ANIMATED PROGRESS RING
# ============================================================================

class AnimatedProgressRing(QWidget):
    """
    Animated circular progress ring with glow effect
    """

    def __init__(self,
                 title: str = "Progress",
                 min_value: float = 0,
                 max_value: float = 100,
                 color: QColor = None,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.min_value = min_value
        self.max_value = max_value
        self.color = color or QColor(0, 200, 255)

        self._current_value = min_value
        self._target_value = min_value
        self._display_value = min_value

        self._rotation_angle = 0
        self._glow_phase = 0

        self.setMinimumSize(150, 170)

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
        self._rotation_angle += 1
        self._glow_phase += 0.05

        if self._rotation_angle >= 360:
            self._rotation_angle = 0
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

        width = self.width()
        height = self.height()

        center_x = width / 2
        center_y = height / 2 - 10
        radius = min(width, height) / 2 - 25

        percentage = (self._display_value - self.min_value) / (self.max_value - self.min_value)

        # Background ring
        painter.setPen(QPen(QColor(40, 50, 60), 10))
        painter.setBrush(Qt.BrushStyle.NoBrush)

        arc_rect = QRectF(center_x - radius, center_y - radius, radius * 2, radius * 2)
        painter.drawArc(arc_rect, 0, 360 * 16)

        # Glow effect
        glow_intensity = 0.6 + 0.4 * math.sin(self._glow_phase)

        for i in range(4, 0, -1):
            glow_color = QColor(self.color)
            glow_color.setAlpha(int(40 * glow_intensity * (5 - i) / 4))

            pen = QPen(glow_color, 10 + i * 3)
            pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            painter.setPen(pen)
            painter.drawArc(arc_rect, 90 * 16, -int(360 * 16 * percentage))

        # Progress arc
        arc_gradient = QConicalGradient(center_x, center_y, 90)
        arc_gradient.setColorAt(0, self.color)
        arc_gradient.setColorAt(percentage, self.color.lighter(150))
        arc_gradient.setColorAt(percentage + 0.01, QColor(0, 0, 0, 0))

        pen = QPen(QBrush(arc_gradient), 10)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        painter.setPen(pen)
        painter.drawArc(arc_rect, 90 * 16, -int(360 * 16 * percentage))

        # Rotating dots
        for i in range(8):
            dot_angle = math.radians(self._rotation_angle + i * 45)
            dot_x = center_x + (radius + 18) * math.cos(dot_angle)
            dot_y = center_y - (radius + 18) * math.sin(dot_angle)

            dot_alpha = int(100 + 100 * math.sin(self._glow_phase + i))
            dot_color = QColor(self.color)
            dot_color.setAlpha(dot_alpha)

            painter.setBrush(QBrush(dot_color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(QPointF(dot_x, dot_y), 3, 3)

        # Center text
        painter.setFont(QFont("Arial", 24, QFont.Weight.Bold))
        painter.setPen(QPen(self.color))

        value_text = f"{self._display_value:.0f}%"
        value_rect = QRectF(center_x - 50, center_y - 15, 100, 30)
        painter.drawText(value_rect, Qt.AlignmentFlag.AlignCenter, value_text)

        # Title
        painter.setFont(QFont("Arial", 10))
        painter.setPen(QPen(QColor(180, 190, 200)))

        title_rect = QRectF(center_x - 50, center_y + radius + 15, 100, 20)
        painter.drawText(title_rect, Qt.AlignmentFlag.AlignCenter, self.title)


# ============================================================================
# ANIMATED WAVEFORM
# ============================================================================

class AnimatedWaveform(QWidget):
    """
    Animated audio-style waveform visualization
    """

    def __init__(self,
                 title: str = "Signal",
                 num_bars: int = 32,
                 color: QColor = None,
                 parent=None):
        super().__init__(parent)

        self.title = title
        self.num_bars = num_bars
        self.color = color or QColor(0, 255, 150)

        # Bar values
        self._values = [0.0] * num_bars
        self._target_values = [0.0] * num_bars

        # Animation
        self._phase = 0

        self.setMinimumSize(300, 100)

        # Animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self._animate)
        self.animation_timer.start(16)

    def setValues(self, values: list):
        """Set bar values (0-1)"""
        for i, v in enumerate(values[:self.num_bars]):
            self._target_values[i] = max(0, min(1, v))

    def setRandomValues(self):
        """Set random values for testing"""
        for i in range(self.num_bars):
            self._target_values[i] = random.uniform(0.1, 1.0)

    def _animate(self):
        self._phase += 0.1

        # Smooth value transitions
        for i in range(self.num_bars):
            diff = self._target_values[i] - self._values[i]
            self._values[i] += diff * 0.2

        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        width = self.width()
        height = self.height()

        # Margins
        margin_x = 20
        margin_y = 30

        chart_width = width - margin_x * 2
        chart_height = height - margin_y * 2

        bar_width = chart_width / self.num_bars * 0.7
        bar_spacing = chart_width / self.num_bars

        center_y = margin_y + chart_height / 2

        for i in range(self.num_bars):
            value = self._values[i]

            # Add wave effect
            wave = math.sin(self._phase + i * 0.3) * 0.1
            display_value = max(0.05, min(1, value + wave))

            bar_height = chart_height * display_value / 2

            x = margin_x + i * bar_spacing + (bar_spacing - bar_width) / 2

            # Glow effect
            glow_intensity = 0.5 + 0.5 * value

            for j in range(3, 0, -1):
                glow_color = QColor(self.color)
                glow_color.setAlpha(int(40 * glow_intensity * (4 - j) / 3))

                painter.setBrush(QBrush(glow_color))
                painter.setPen(Qt.PenStyle.NoPen)

                # Top bar
                painter.drawRoundedRect(
                    QRectF(x - j, center_y - bar_height - j, bar_width + j * 2, bar_height + j),
                    2, 2
                )
                # Bottom bar (mirrored)
                painter.drawRoundedRect(
                    QRectF(x - j, center_y - j, bar_width + j * 2, bar_height + j),
                    2, 2
                )

            # Main bars
            bar_gradient = QLinearGradient(x, center_y - bar_height, x, center_y + bar_height)
            bar_gradient.setColorAt(0, self.color.lighter(150))
            bar_gradient.setColorAt(0.5, self.color)
            bar_gradient.setColorAt(1, self.color.lighter(150))

            painter.setBrush(QBrush(bar_gradient))
            painter.setPen(Qt.PenStyle.NoPen)

            # Top bar
            painter.drawRoundedRect(
                QRectF(x, center_y - bar_height, bar_width, bar_height),
                2, 2
            )
            # Bottom bar
            painter.drawRoundedRect(
                QRectF(x, center_y, bar_width, bar_height),
                2, 2
            )

        # Center line
        painter.setPen(QPen(QColor(self.color.red(), self.color.green(),
                                  self.color.blue(), 100), 1))
        painter.drawLine(QPointF(margin_x, center_y), QPointF(width - margin_x, center_y))

        # Title
        painter.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        painter.setPen(QPen(self.color))
        painter.drawText(QRectF(0, 5, width, 20), Qt.AlignmentFlag.AlignCenter, self.title)


# ============================================================================
# DEMO DASHBOARD
# ============================================================================

class AdvancedVisualizationDashboard(QMainWindow):
    """
    Demo dashboard showing all advanced visualizations
    """

    def __init__(self):
        super().__init__()

        self.setWindowTitle("Advanced Animated Visualizations")
        self.setGeometry(100, 100, 1400, 900)

        # Dark theme
        self.setStyleSheet("""
            QMainWindow {
                background-color: #0a0e14;
            }
            QWidget {
                background-color: #0a0e14;
                color: #e0e0e0;
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
                color: #00d4ff;
            }
        """)

        # Central widget
        central = QWidget()
        self.setCentralWidget(central)

        main_layout = QVBoxLayout(central)
        main_layout.setSpacing(15)
        main_layout.setContentsMargins(15, 15, 15, 15)

        # Title
        title = QLabel("🎨 ADVANCED ANIMATED VISUALIZATIONS")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #00d4ff; padding: 10px;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main_layout.addWidget(title)

        # Content area
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)

        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setSpacing(20)

        # Row 1: Radar and Heatmap
        row1 = QHBoxLayout()

        # Radar chart
        radar_group = QGroupBox("📡 Performance Radar")
        radar_layout = QVBoxLayout(radar_group)
        self.radar_chart = AnimatedRadarChart(
            title="System Performance",
            categories=["Speed", "Accuracy", "Efficiency", "Reliability", "Throughput"]
        )
        radar_layout.addWidget(self.radar_chart)
        row1.addWidget(radar_group)

        # Heatmap
        heatmap_group = QGroupBox("🌡️ Activity Heatmap")
        heatmap_layout = QVBoxLayout(heatmap_group)
        self.heatmap = AnimatedHeatmap(
            title="24-Hour Activity",
            rows=7,
            cols=24,
            row_labels=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        )
        heatmap_layout.addWidget(self.heatmap)
        row1.addWidget(heatmap_group)

        content_layout.addLayout(row1)

        # Row 2: Progress rings and waveform
        row2 = QHBoxLayout()

        # Progress rings
        rings_group = QGroupBox("🔄 Progress Indicators")
        rings_layout = QHBoxLayout(rings_group)

        self.ring1 = AnimatedProgressRing("CPU", color=QColor(0, 200, 255))
        self.ring2 = AnimatedProgressRing("Memory", color=QColor(255, 150, 50))
        self.ring3 = AnimatedProgressRing("Disk", color=QColor(0, 255, 150))
        self.ring4 = AnimatedProgressRing("Network", color=QColor(200, 100, 255))

        rings_layout.addWidget(self.ring1)
        rings_layout.addWidget(self.ring2)
        rings_layout.addWidget(self.ring3)
        rings_layout.addWidget(self.ring4)

        row2.addWidget(rings_group)

        # Waveform
        wave_group = QGroupBox("📊 Signal Waveform")
        wave_layout = QVBoxLayout(wave_group)
        self.waveform = AnimatedWaveform("Audio Level", num_bars=32)
        wave_layout.addWidget(self.waveform)
        row2.addWidget(wave_group)

        content_layout.addLayout(row2)

        scroll.setWidget(content)
        main_layout.addWidget(scroll)

        # Start data simulation
        self.start_simulation()

    def start_simulation(self):
        """Start data simulation"""
        self.sim_timer = QTimer(self)
        self.sim_timer.timeout.connect(self.update_data)
        self.sim_timer.start(100)

    def update_data(self):
        """Update all visualizations with simulated data"""
        # Radar
        self.radar_chart.setValues({
            "Speed": random.uniform(40, 90),
            "Accuracy": random.uniform(60, 95),
            "Efficiency": random.uniform(50, 85),
            "Reliability": random.uniform(70, 99),
            "Throughput": random.uniform(45, 80),
        })

        # Heatmap - random activity data
        data = np.random.random((7, 24)) * 0.5
        # Add some hot spots
        data[random.randint(0, 6), random.randint(0, 23)] = random.uniform(0.7, 1.0)
        self.heatmap.setData(data)

        # Progress rings
        self.ring1.setValue(random.uniform(30, 80))
        self.ring2.setValue(random.uniform(40, 70))
        self.ring3.setValue(random.uniform(20, 60))
        self.ring4.setValue(random.uniform(10, 90))

        # Waveform
        self.waveform.setRandomValues()


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    dashboard = AdvancedVisualizationDashboard()
    dashboard.show()

    print("🎨 Advanced Visualization Dashboard Started")
    print("   - Animated radar chart with scan effect")
    print("   - Animated heatmap with wave effect")
    print("   - Animated progress rings")
    print("   - Audio-style waveform visualization")

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
