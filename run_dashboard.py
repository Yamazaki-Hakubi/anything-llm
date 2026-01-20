#!/usr/bin/env python3
"""
UNIFIED DASHBOARD LAUNCHER
Run the complete animated gauges and charts dashboard
"""

import sys
import argparse


def check_dependencies():
    """Check and report missing dependencies"""
    missing = []

    try:
        from PyQt6.QtWidgets import QApplication
    except ImportError:
        missing.append("PyQt6")

    try:
        import numpy
    except ImportError:
        missing.append("numpy")

    if missing:
        print("❌ Missing dependencies:")
        for dep in missing:
            print(f"   - {dep}")
        print("\nInstall with:")
        print(f"   pip install {' '.join(missing)}")
        return False

    return True


def run_main_dashboard():
    """Run the main animated gauges dashboard"""
    from animated_gauges_dashboard import main
    main()


def run_advanced_dashboard():
    """Run the advanced visualizations dashboard"""
    from advanced_visualizations import main
    main()


def run_combined_dashboard():
    """Run a combined dashboard with all widgets"""
    from PyQt6.QtWidgets import *
    from PyQt6.QtCore import *
    from PyQt6.QtGui import *

    from animated_gauges_dashboard import (
        AnimatedPillGauge,
        AnimatedCircularGauge,
        AnimatedSpeedometer,
        LiveLineChart,
        LiveCandlestickChart,
        LiveBarChart
    )

    from advanced_visualizations import (
        AnimatedRadarChart,
        AnimatedHeatmap,
        AnimatedProgressRing,
        AnimatedWaveform,
        ParticleBackground
    )

    import random
    import numpy as np
    from datetime import datetime

    class CombinedDashboard(QMainWindow):
        def __init__(self):
            super().__init__()

            self.setWindowTitle("🚀 Complete Animated Trading Dashboard")
            self.setGeometry(50, 50, 1800, 1000)

            # Dark theme
            self.setStyleSheet("""
                QMainWindow {
                    background-color: #05080d;
                }
                QWidget {
                    background-color: transparent;
                    color: #e0e0e0;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
                QGroupBox {
                    font-weight: bold;
                    border: 2px solid #1a2030;
                    border-radius: 10px;
                    margin-top: 12px;
                    padding-top: 12px;
                    background-color: rgba(15, 20, 30, 200);
                }
                QGroupBox::title {
                    subcontrol-origin: margin;
                    left: 15px;
                    padding: 0 8px;
                    color: #00d4ff;
                    font-size: 13px;
                }
                QScrollArea {
                    border: none;
                }
                QTabWidget::pane {
                    border: 1px solid #2a3040;
                    background-color: rgba(15, 20, 30, 150);
                    border-radius: 8px;
                }
                QTabBar::tab {
                    background-color: #1a2030;
                    color: #8090a0;
                    padding: 10px 20px;
                    margin-right: 2px;
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                }
                QTabBar::tab:selected {
                    background-color: #00d4ff;
                    color: #000000;
                    font-weight: bold;
                }
                QTabBar::tab:hover:!selected {
                    background-color: #2a3a50;
                }
            """)

            # Main widget with particle background
            main_widget = QWidget()
            self.setCentralWidget(main_widget)

            # Particle background
            self.particles = ParticleBackground(main_widget)
            self.particles.setGeometry(0, 0, 1800, 1000)
            self.particles.num_particles = 80
            self.particles._init_particles()

            # Main layout on top of particles
            main_layout = QVBoxLayout(main_widget)
            main_layout.setSpacing(10)
            main_layout.setContentsMargins(15, 15, 15, 15)

            # Header
            header = QWidget()
            header.setStyleSheet("background-color: rgba(10, 15, 25, 200); border-radius: 10px;")
            header_layout = QHBoxLayout(header)

            title = QLabel("📊 ULTIMATE ANIMATED TRADING DASHBOARD")
            title.setStyleSheet("""
                font-size: 26px;
                font-weight: bold;
                color: #00d4ff;
                padding: 15px;
            """)
            header_layout.addWidget(title)

            header_layout.addStretch()

            # Status indicators
            status_widget = QWidget()
            status_layout = QHBoxLayout(status_widget)

            status_label = QLabel("🟢 SYSTEM ONLINE")
            status_label.setStyleSheet("color: #00ff88; font-weight: bold; padding: 10px;")
            status_layout.addWidget(status_label)

            time_label = QLabel(datetime.now().strftime("%H:%M:%S"))
            time_label.setStyleSheet("color: #8090a0; padding: 10px;")
            status_layout.addWidget(time_label)

            header_layout.addWidget(status_widget)
            main_layout.addWidget(header)

            # Create tabs
            tabs = QTabWidget()

            # === TAB 1: GAUGES ===
            gauges_tab = QWidget()
            gauges_layout = QVBoxLayout(gauges_tab)
            gauges_layout.setSpacing(15)

            # Row 1: Pill gauges
            pill_group = QGroupBox("⚡ CORE METRICS")
            pill_layout = QVBoxLayout(pill_group)

            self.pnl_gauge = AnimatedPillGauge("P&L", "Total Profit/Loss", -10000, 10000, "$", "gold")
            self.win_rate_gauge = AnimatedPillGauge("Win Rate", "Success %", 0, 100, "%", "green")
            self.risk_gauge = AnimatedPillGauge("Risk", "Exposure Level", 0, 100, "%", "red")
            self.latency_gauge = AnimatedPillGauge("Latency", "Response Time", 0, 200, "ms", "blue")

            pill_layout.addWidget(self.pnl_gauge)
            pill_layout.addWidget(self.win_rate_gauge)
            pill_layout.addWidget(self.risk_gauge)
            pill_layout.addWidget(self.latency_gauge)

            gauges_layout.addWidget(pill_group)

            # Row 2: Circular gauges
            circular_row = QHBoxLayout()

            self.cpu_gauge = AnimatedCircularGauge("CPU", 0, 100, "%", "cyan")
            self.memory_gauge = AnimatedCircularGauge("Memory", 0, 100, "%", "orange")
            self.network_gauge = AnimatedCircularGauge("Network", 0, 100, "Mbps", "green")
            self.accuracy_gauge = AnimatedCircularGauge("Accuracy", 0, 100, "%", "purple")

            circular_row.addWidget(self.cpu_gauge)
            circular_row.addWidget(self.memory_gauge)
            circular_row.addWidget(self.network_gauge)
            circular_row.addWidget(self.accuracy_gauge)

            gauges_layout.addLayout(circular_row)

            # Row 3: Speedometers
            speed_row = QHBoxLayout()

            speed_group = QGroupBox("🚀 SPEED METRICS")
            speed_layout = QHBoxLayout(speed_group)

            self.order_speed = AnimatedSpeedometer("Order Rate", 0, 500, "OPS", 350, 450)
            self.system_load = AnimatedSpeedometer("System Load", 0, 100, "%", 70, 90)

            speed_layout.addWidget(self.order_speed)
            speed_layout.addWidget(self.system_load)

            speed_row.addWidget(speed_group)
            gauges_layout.addLayout(speed_row)

            tabs.addTab(gauges_tab, "📊 Gauges")

            # === TAB 2: CHARTS ===
            charts_tab = QWidget()
            charts_layout = QVBoxLayout(charts_tab)

            # Row 1
            row1 = QHBoxLayout()

            self.pnl_chart = LiveLineChart("Real-Time P&L", "P&L ($)", 100, QColor(0, 255, 200))
            self.price_chart = LiveCandlestickChart("BTC/USD Price", 50)

            row1.addWidget(self.pnl_chart)
            row1.addWidget(self.price_chart)

            charts_layout.addLayout(row1)

            # Row 2
            row2 = QHBoxLayout()

            self.volume_chart = LiveBarChart(
                "Volume by Asset",
                ["BTC", "ETH", "SOL", "ADA", "DOT"],
                [QColor(247, 147, 26), QColor(98, 126, 234), QColor(0, 255, 163),
                 QColor(0, 51, 173), QColor(230, 0, 122)]
            )
            self.latency_chart = LiveLineChart("Latency", "ms", 100, QColor(255, 100, 100))

            row2.addWidget(self.volume_chart)
            row2.addWidget(self.latency_chart)

            charts_layout.addLayout(row2)

            tabs.addTab(charts_tab, "📈 Charts")

            # === TAB 3: ADVANCED ===
            advanced_tab = QWidget()
            advanced_layout = QVBoxLayout(advanced_tab)

            # Row 1: Radar and Heatmap
            adv_row1 = QHBoxLayout()

            self.radar = AnimatedRadarChart(
                "Performance Analysis",
                ["Speed", "Accuracy", "Efficiency", "Reliability", "Throughput"]
            )

            self.heatmap = AnimatedHeatmap(
                "24-Hour Activity",
                rows=7, cols=24,
                row_labels=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            )

            adv_row1.addWidget(self.radar)
            adv_row1.addWidget(self.heatmap)

            advanced_layout.addLayout(adv_row1)

            # Row 2: Progress rings and waveform
            adv_row2 = QHBoxLayout()

            rings_widget = QWidget()
            rings_layout = QHBoxLayout(rings_widget)

            self.ring1 = AnimatedProgressRing("Tasks", color=QColor(0, 200, 255))
            self.ring2 = AnimatedProgressRing("Goals", color=QColor(255, 150, 50))
            self.ring3 = AnimatedProgressRing("Uptime", color=QColor(0, 255, 150))

            rings_layout.addWidget(self.ring1)
            rings_layout.addWidget(self.ring2)
            rings_layout.addWidget(self.ring3)

            adv_row2.addWidget(rings_widget)

            self.waveform = AnimatedWaveform("Market Signal", 48)
            adv_row2.addWidget(self.waveform)

            advanced_layout.addLayout(adv_row2)

            tabs.addTab(advanced_tab, "🎯 Advanced")

            main_layout.addWidget(tabs)

            # Initialize price data
            self.current_price = 50000
            self.candle_open = self.current_price
            self.candle_high = self.current_price
            self.candle_low = self.current_price

            # Start data simulation
            self.start_simulation()

            # Update time label
            self.time_timer = QTimer(self)
            self.time_timer.timeout.connect(lambda: time_label.setText(
                datetime.now().strftime("%H:%M:%S")
            ))
            self.time_timer.start(1000)

        def resizeEvent(self, event):
            super().resizeEvent(event)
            self.particles.setGeometry(0, 0, self.width(), self.height())

        def start_simulation(self):
            """Start all data simulations"""
            # Gauges
            self.gauge_timer = QTimer(self)
            self.gauge_timer.timeout.connect(self.update_gauges)
            self.gauge_timer.start(100)

            # Charts
            self.chart_timer = QTimer(self)
            self.chart_timer.timeout.connect(self.update_charts)
            self.chart_timer.start(500)

            # Candles
            self.candle_timer = QTimer(self)
            self.candle_timer.timeout.connect(self.update_candles)
            self.candle_timer.start(2000)

            # Advanced
            self.adv_timer = QTimer(self)
            self.adv_timer.timeout.connect(self.update_advanced)
            self.adv_timer.start(200)

        def update_gauges(self):
            # Pill gauges
            self.pnl_gauge.setValue(self.pnl_gauge.value() + random.uniform(-100, 120))
            self.win_rate_gauge.setValue(max(40, min(80, self.win_rate_gauge.value() + random.uniform(-0.5, 0.5))))
            self.risk_gauge.setValue(max(10, min(60, self.risk_gauge.value() + random.uniform(-1, 1))))
            self.latency_gauge.setValue(max(10, min(150, self.latency_gauge.value() + random.uniform(-5, 5))))

            # Circular gauges
            self.cpu_gauge.setValue(max(10, min(90, self.cpu_gauge.value() + random.uniform(-3, 3))))
            self.memory_gauge.setValue(max(30, min(80, self.memory_gauge.value() + random.uniform(-1, 1))))
            self.network_gauge.setValue(max(20, min(95, self.network_gauge.value() + random.uniform(-5, 5))))
            self.accuracy_gauge.setValue(max(60, min(99, self.accuracy_gauge.value() + random.uniform(-0.5, 0.5))))

            # Speedometers
            self.order_speed.setValue(max(50, min(480, self.order_speed.value() + random.uniform(-20, 20))))
            self.system_load.setValue(max(20, min(95, self.system_load.value() + random.uniform(-3, 3))))

        def update_charts(self):
            # Line charts
            self.pnl_chart.addDataPoint(self.pnl_gauge.value())
            self.latency_chart.addDataPoint(self.latency_gauge.value())

            # Bar chart
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
            self.price_chart.addCandle(
                self.candle_open,
                self.candle_high,
                self.candle_low,
                self.current_price
            )
            self.candle_open = self.current_price
            self.candle_high = self.current_price
            self.candle_low = self.current_price

        def update_advanced(self):
            # Radar
            self.radar.setValues({
                "Speed": random.uniform(40, 90),
                "Accuracy": random.uniform(60, 95),
                "Efficiency": random.uniform(50, 85),
                "Reliability": random.uniform(70, 99),
                "Throughput": random.uniform(45, 80),
            })

            # Heatmap
            data = np.random.random((7, 24)) * 0.5
            data[random.randint(0, 6), random.randint(0, 23)] = random.uniform(0.7, 1.0)
            self.heatmap.setData(data)

            # Progress rings
            self.ring1.setValue(random.uniform(30, 80))
            self.ring2.setValue(random.uniform(40, 70))
            self.ring3.setValue(random.uniform(85, 99))

            # Waveform
            self.waveform.setRandomValues()

    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    dashboard = CombinedDashboard()
    dashboard.show()

    print("\n" + "="*60)
    print("🚀 ULTIMATE ANIMATED TRADING DASHBOARD")
    print("="*60)
    print("\nFeatures:")
    print("  📊 Pill Gauges - Glowing capsule-style meters")
    print("  🎯 Circular Gauges - Arc displays with rotation")
    print("  🚗 Speedometers - Needle gauges with zones")
    print("  📈 Live Charts - Real-time line, bar, candlestick")
    print("  📡 Radar Chart - Multi-axis with scan effect")
    print("  🌡️ Heatmap - Color-coded activity grid")
    print("  🔄 Progress Rings - Animated circular progress")
    print("  🎵 Waveform - Audio-style visualizer")
    print("  ✨ Particle Background - Connected nodes effect")
    print("\nUse the tabs to switch between views!")
    print("="*60 + "\n")

    sys.exit(app.exec())


def main():
    parser = argparse.ArgumentParser(
        description="Animated Gauges and Charts Dashboard",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_dashboard.py              # Run combined dashboard
  python run_dashboard.py --gauges     # Run gauges dashboard
  python run_dashboard.py --advanced   # Run advanced visualizations
  python run_dashboard.py --combined   # Run combined dashboard
        """
    )

    parser.add_argument('--gauges', action='store_true',
                       help='Run the main gauges dashboard')
    parser.add_argument('--advanced', action='store_true',
                       help='Run the advanced visualizations dashboard')
    parser.add_argument('--combined', action='store_true',
                       help='Run the combined dashboard (default)')
    parser.add_argument('--check', action='store_true',
                       help='Check dependencies only')

    args = parser.parse_args()

    if args.check:
        if check_dependencies():
            print("✅ All dependencies are installed!")
        return

    if not check_dependencies():
        return

    if args.gauges:
        run_main_dashboard()
    elif args.advanced:
        run_advanced_dashboard()
    else:
        run_combined_dashboard()


if __name__ == "__main__":
    main()
