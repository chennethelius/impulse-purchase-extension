"""
Modern Dashboard UI using CustomTkinter
A beautiful, dark-themed desktop application for Impulse Purchase tracking
"""

import customtkinter as ctk
from tkinter import Canvas, Frame
import json
import os
from datetime import datetime, timedelta
from collections import Counter
import math

# Set appearance mode and color theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class ModernDashboard(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configure window
        self.title("Impulse Guard - Control Center")
        self.geometry("1400x900")
        self.minsize(1200, 700)
        
        # Color scheme
        self.colors = {
            'bg_dark': '#0a0e27',
            'bg_secondary': '#151b3d',
            'bg_card': '#1e2749',
            'accent_cyan': '#00d4ff',
            'accent_orange': '#ed8936',
            'accent_green': '#48bb78',
            'accent_red': '#f56565',
            'text_primary': '#ffffff',
            'text_secondary': '#a0aec0',
            'border': '#2d3748'
        }
        
        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Current page
        self.current_page = "dashboard"
        
        # Create UI components
        self.create_sidebar()
        self.create_main_content()
        
        # Load data
        self.load_stats()
        
    def create_sidebar(self):
        """Create animated sidebar with navigation"""
        self.sidebar = ctk.CTkFrame(self, width=250, corner_radius=0, fg_color=self.colors['bg_secondary'])
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)
        self.sidebar.grid_rowconfigure(6, weight=1)
        
        # Logo and title
        logo_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        logo_frame.grid(row=0, column=0, padx=20, pady=(30, 20))
        
        title = ctk.CTkLabel(
            logo_frame, 
            text="⚡ Impulse Guard",
            font=ctk.CTkFont(family="Tahoma", size=24, weight="bold"),
            text_color=self.colors['accent_cyan']
        )
        title.pack()
        
        subtitle = ctk.CTkLabel(
            logo_frame,
            text="Control Center v2.0",
            font=ctk.CTkFont(family="Tahoma", size=11),
            text_color=self.colors['text_secondary']
        )
        subtitle.pack()
        
        # Navigation buttons
        self.nav_buttons = {}
        nav_items = [
            ("📊", "Dashboard", "dashboard"),
            ("🛍️", "Purchases", "purchases"),
            ("💰", "Savings", "savings"),
            ("📈", "Analytics", "analytics"),
            ("⚙️", "Settings", "settings")
        ]
        
        for i, (icon, label, page) in enumerate(nav_items):
            btn = ctk.CTkButton(
                self.sidebar,
                text=f"{icon}  {label}",
                font=ctk.CTkFont(family="Tahoma", size=14),
                height=50,
                corner_radius=10,
                fg_color="transparent",
                hover_color=self.colors['bg_card'],
                text_color=self.colors['text_secondary'],
                anchor="w",
                command=lambda p=page: self.switch_page(p)
            )
            btn.grid(row=i+1, column=0, padx=15, pady=5, sticky="ew")
            self.nav_buttons[page] = btn
        
        # Stats summary in sidebar
        self.sidebar_stats = ctk.CTkFrame(self.sidebar, fg_color=self.colors['bg_card'], corner_radius=10)
        self.sidebar_stats.grid(row=7, column=0, padx=15, pady=20, sticky="ew")
        
        ctk.CTkLabel(
            self.sidebar_stats,
            text="Quick Stats",
            font=ctk.CTkFont(family="Tahoma", size=12, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(10, 5))
        
        self.quick_stats_labels = {}
        stats_data = [
            ("Total", "0", self.colors['accent_cyan']),
            ("Saved", "$0", self.colors['accent_green'])
        ]
        
        for label, value, color in stats_data:
            frame = ctk.CTkFrame(self.sidebar_stats, fg_color="transparent")
            frame.pack(pady=2, fill="x", padx=10)
            
            ctk.CTkLabel(
                frame,
                text=label,
                font=ctk.CTkFont(family="Tahoma", size=10),
                text_color=self.colors['text_secondary']
            ).pack(side="left")
            
            value_label = ctk.CTkLabel(
                frame,
                text=value,
                font=ctk.CTkFont(family="Tahoma", size=11, weight="bold"),
                text_color=color
            )
            value_label.pack(side="right")
            self.quick_stats_labels[label] = value_label
        
        # Footer
        footer = ctk.CTkLabel(
            self.sidebar,
            text="© 2025 Impulse Guard",
            font=ctk.CTkFont(family="Tahoma", size=9),
            text_color=self.colors['text_secondary']
        )
        footer.grid(row=8, column=0, pady=(0, 15))
        
        # Highlight current page
        self.highlight_nav_button("dashboard")
        
    def create_main_content(self):
        """Create main content area with scrollable frame"""
        self.main_frame = ctk.CTkFrame(self, fg_color=self.colors['bg_dark'], corner_radius=0)
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Scrollable frame for content
        self.scroll_frame = ctk.CTkScrollableFrame(
            self.main_frame,
            fg_color=self.colors['bg_dark'],
            corner_radius=0
        )
        self.scroll_frame.grid(row=0, column=0, sticky="nsew")
        self.scroll_frame.grid_columnconfigure(0, weight=1)
        
        # Create all pages
        self.pages = {}
        self.create_dashboard_page()
        self.create_purchases_page()
        self.create_savings_page()
        self.create_analytics_page()
        self.create_settings_page()
        
        # Show dashboard by default
        self.show_page("dashboard")
        
    def create_dashboard_page(self):
        """Create the main dashboard page"""
        page = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        
        # Header
        header = ctk.CTkLabel(
            page,
            text="Guardian Control Center",
            font=ctk.CTkFont(family="Tahoma", size=32, weight="bold"),
            text_color=self.colors['text_primary']
        )
        header.grid(row=0, column=0, columnspan=4, pady=(20, 5), sticky="w", padx=30)
        
        subtitle = ctk.CTkLabel(
            page,
            text="Impulse Purchase Tracking System",
            font=ctk.CTkFont(family="Tahoma", size=14),
            text_color=self.colors['text_secondary']
        )
        subtitle.grid(row=1, column=0, columnspan=4, pady=(0, 30), sticky="w", padx=30)
        
        # Stats cards
        stats_frame = ctk.CTkFrame(page, fg_color="transparent")
        stats_frame.grid(row=2, column=0, columnspan=4, sticky="ew", padx=30, pady=10)
        stats_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        self.stat_cards = {}
        stat_configs = [
            ("Total Purchases", "0", "📊", self.colors['accent_cyan']),
            ("Purchases Made", "0", "🛍️", self.colors['accent_orange']),
            ("Resisted", "0", "🛡️", self.colors['accent_green']),
            ("Money Saved", "$0.00", "💰", self.colors['accent_green'])
        ]
        
        for i, (title, value, icon, color) in enumerate(stat_configs):
            card = self.create_stat_card(stats_frame, title, value, icon, color)
            card.grid(row=0, column=i, padx=10, pady=5, sticky="ew")
            self.stat_cards[title] = card
        
        # Analytics cards row
        analytics_frame = ctk.CTkFrame(page, fg_color="transparent")
        analytics_frame.grid(row=3, column=0, columnspan=4, sticky="ew", padx=30, pady=10)
        analytics_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        self.analytics_cards = {}
        analytics_configs = [
            ("Current Streak", "0 days", "🔥", self.colors['accent_orange']),
            ("Biggest Save", "$0.00", "🏆", self.colors['accent_cyan']),
            ("Success Rate", "0%", "📈", self.colors['accent_green']),
            ("Daily Average", "0", "📅", self.colors['accent_cyan'])
        ]
        
        for i, (title, value, icon, color) in enumerate(analytics_configs):
            card = self.create_stat_card(analytics_frame, title, value, icon, color)
            card.grid(row=0, column=i, padx=10, pady=5, sticky="ew")
            self.analytics_cards[title] = card
        
        # Category Analysis (Radar Chart Placeholder)
        category_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        category_card.grid(row=4, column=0, columnspan=4, sticky="ew", padx=30, pady=20)
        
        ctk.CTkLabel(
            category_card,
            text="Purchase Category Analysis",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.category_canvas = Canvas(
            category_card,
            bg=self.colors['bg_card'],
            highlightthickness=0,
            height=400
        )
        self.category_canvas.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # Recent Purchases
        recent_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        recent_card.grid(row=5, column=0, columnspan=4, sticky="ew", padx=30, pady=(0, 30))
        
        ctk.CTkLabel(
            recent_card,
            text="Recent Purchase Log",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.recent_purchases_frame = ctk.CTkFrame(recent_card, fg_color="transparent")
        self.recent_purchases_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        self.pages["dashboard"] = page
        
    def create_purchases_page(self):
        """Create the purchases history page"""
        page = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        
        # Header
        header = ctk.CTkLabel(
            page,
            text="Purchase History",
            font=ctk.CTkFont(family="Tahoma", size=32, weight="bold"),
            text_color=self.colors['text_primary']
        )
        header.grid(row=0, column=0, pady=(20, 5), sticky="w", padx=30)
        
        subtitle = ctk.CTkLabel(
            page,
            text="View all your purchase attempts and decisions",
            font=ctk.CTkFont(family="Tahoma", size=14),
            text_color=self.colors['text_secondary']
        )
        subtitle.grid(row=1, column=0, pady=(0, 30), sticky="w", padx=30)
        
        # Filter options
        filter_frame = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        filter_frame.grid(row=2, column=0, sticky="ew", padx=30, pady=10)
        
        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=20, pady=15)
        
        ctk.CTkLabel(
            filter_inner,
            text="Filter:",
            font=ctk.CTkFont(family="Tahoma", size=12),
            text_color=self.colors['text_secondary']
        ).pack(side="left", padx=(0, 10))
        
        self.filter_var = ctk.StringVar(value="all")
        filters = [("All", "all"), ("Purchased", "victory"), ("Resisted", "defeat")]
        
        for text, value in filters:
            ctk.CTkRadioButton(
                filter_inner,
                text=text,
                variable=self.filter_var,
                value=value,
                font=ctk.CTkFont(family="Tahoma", size=12),
                fg_color=self.colors['accent_cyan'],
                hover_color=self.colors['accent_cyan'],
                command=self.update_purchases_display
            ).pack(side="left", padx=10)
        
        # Purchases list
        self.purchases_list_frame = ctk.CTkFrame(page, fg_color="transparent")
        self.purchases_list_frame.grid(row=3, column=0, sticky="ew", padx=30, pady=(0, 30))
        
        self.pages["purchases"] = page
        
    def create_savings_page(self):
        """Create the savings analysis page"""
        page = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        
        # Header
        header = ctk.CTkLabel(
            page,
            text="Savings Analysis",
            font=ctk.CTkFont(family="Tahoma", size=32, weight="bold"),
            text_color=self.colors['text_primary']
        )
        header.grid(row=0, column=0, columnspan=2, pady=(20, 5), sticky="w", padx=30)
        
        subtitle = ctk.CTkLabel(
            page,
            text="Track your financial progress and achievements",
            font=ctk.CTkFont(family="Tahoma", size=14),
            text_color=self.colors['text_secondary']
        )
        subtitle.grid(row=1, column=0, columnspan=2, pady=(0, 30), sticky="w", padx=30)
        
        # Savings summary cards
        summary_frame = ctk.CTkFrame(page, fg_color="transparent")
        summary_frame.grid(row=2, column=0, columnspan=2, sticky="ew", padx=30, pady=10)
        summary_frame.grid_columnconfigure((0, 1, 2), weight=1)
        
        self.savings_cards = {}
        savings_configs = [
            ("Total Saved", "$0.00", "💰"),
            ("Average Save", "$0.00", "📊"),
            ("Biggest Save", "$0.00", "🏆")
        ]
        
        for i, (title, value, icon) in enumerate(savings_configs):
            card = ctk.CTkFrame(summary_frame, fg_color=self.colors['bg_card'], corner_radius=15)
            card.grid(row=0, column=i, padx=10, pady=5, sticky="ew")
            
            ctk.CTkLabel(
                card,
                text=icon,
                font=ctk.CTkFont(family="Tahoma", size=32)
            ).pack(pady=(20, 5))
            
            value_label = ctk.CTkLabel(
                card,
                text=value,
                font=ctk.CTkFont(family="Tahoma", size=24, weight="bold"),
                text_color=self.colors['accent_green']
            )
            value_label.pack(pady=5)
            
            ctk.CTkLabel(
                card,
                text=title,
                font=ctk.CTkFont(family="Tahoma", size=12),
                text_color=self.colors['text_secondary']
            ).pack(pady=(0, 20))
            
            self.savings_cards[title] = value_label
        
        # Savings chart
        chart_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        chart_card.grid(row=3, column=0, columnspan=2, sticky="ew", padx=30, pady=20)
        
        ctk.CTkLabel(
            chart_card,
            text="Cumulative Savings Over Time",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.savings_canvas = Canvas(
            chart_card,
            bg=self.colors['bg_card'],
            highlightthickness=0,
            height=350
        )
        self.savings_canvas.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        self.pages["savings"] = page
        
    def create_analytics_page(self):
        """Create the analytics page"""
        page = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        
        # Header
        header = ctk.CTkLabel(
            page,
            text="Advanced Analytics",
            font=ctk.CTkFont(family="Tahoma", size=32, weight="bold"),
            text_color=self.colors['text_primary']
        )
        header.grid(row=0, column=0, pady=(20, 5), sticky="w", padx=30)
        
        subtitle = ctk.CTkLabel(
            page,
            text="Deep insights into your purchase behavior",
            font=ctk.CTkFont(family="Tahoma", size=14),
            text_color=self.colors['text_secondary']
        )
        subtitle.grid(row=1, column=0, pady=(0, 30), sticky="w", padx=30)
        
        # Time-based analysis
        time_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        time_card.grid(row=2, column=0, sticky="ew", padx=30, pady=10)
        
        ctk.CTkLabel(
            time_card,
            text="Purchase Patterns by Time",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.time_analytics_frame = ctk.CTkFrame(time_card, fg_color="transparent")
        self.time_analytics_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # Category breakdown
        category_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        category_card.grid(row=3, column=0, sticky="ew", padx=30, pady=20)
        
        ctk.CTkLabel(
            category_card,
            text="Category Breakdown",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.category_breakdown_frame = ctk.CTkFrame(category_card, fg_color="transparent")
        self.category_breakdown_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # Success rate trends
        trends_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        trends_card.grid(row=4, column=0, sticky="ew", padx=30, pady=(0, 30))
        
        ctk.CTkLabel(
            trends_card,
            text="Success Rate Trends",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        self.trends_canvas = Canvas(
            trends_card,
            bg=self.colors['bg_card'],
            highlightthickness=0,
            height=300
        )
        self.trends_canvas.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        self.pages["analytics"] = page
        
    def create_settings_page(self):
        """Create the settings page"""
        page = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        
        # Header
        header = ctk.CTkLabel(
            page,
            text="Settings",
            font=ctk.CTkFont(family="Tahoma", size=32, weight="bold"),
            text_color=self.colors['text_primary']
        )
        header.grid(row=0, column=0, pady=(20, 5), sticky="w", padx=30)
        
        subtitle = ctk.CTkLabel(
            page,
            text="Customize your dashboard experience",
            font=ctk.CTkFont(family="Tahoma", size=14),
            text_color=self.colors['text_secondary']
        )
        subtitle.grid(row=1, column=0, pady=(0, 30), sticky="w", padx=30)
        
        # Appearance settings
        appearance_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        appearance_card.grid(row=2, column=0, sticky="ew", padx=30, pady=10)
        
        ctk.CTkLabel(
            appearance_card,
            text="Appearance",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 15), padx=20, anchor="w")
        
        # Theme selector
        theme_frame = ctk.CTkFrame(appearance_card, fg_color="transparent")
        theme_frame.pack(fill="x", padx=20, pady=10)
        
        ctk.CTkLabel(
            theme_frame,
            text="Theme:",
            font=ctk.CTkFont(family="Tahoma", size=12),
            text_color=self.colors['text_secondary']
        ).pack(side="left", padx=(0, 20))
        
        theme_menu = ctk.CTkOptionMenu(
            theme_frame,
            values=["Dark", "Light", "System"],
            command=self.change_theme,
            fg_color=self.colors['bg_secondary'],
            button_color=self.colors['accent_cyan'],
            button_hover_color=self.colors['accent_cyan']
        )
        theme_menu.set("Dark")
        theme_menu.pack(side="left")
        
        # Data settings
        data_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        data_card.grid(row=3, column=0, sticky="ew", padx=30, pady=20)
        
        ctk.CTkLabel(
            data_card,
            text="Data Management",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 15), padx=20, anchor="w")
        
        # Export button
        export_btn = ctk.CTkButton(
            data_card,
            text="📥 Export Data",
            font=ctk.CTkFont(family="Tahoma", size=13),
            height=40,
            corner_radius=10,
            fg_color=self.colors['accent_cyan'],
            hover_color=self.colors['accent_cyan'],
            command=self.export_data
        )
        export_btn.pack(padx=20, pady=10, fill="x")
        
        # Clear data button
        clear_btn = ctk.CTkButton(
            data_card,
            text="🗑️ Clear All Data",
            font=ctk.CTkFont(family="Tahoma", size=13),
            height=40,
            corner_radius=10,
            fg_color=self.colors['accent_red'],
            hover_color="#c53030",
            command=self.clear_data
        )
        clear_btn.pack(padx=20, pady=(0, 20), fill="x")
        
        # About section
        about_card = ctk.CTkFrame(page, fg_color=self.colors['bg_card'], corner_radius=15)
        about_card.grid(row=4, column=0, sticky="ew", padx=30, pady=(0, 30))
        
        ctk.CTkLabel(
            about_card,
            text="About",
            font=ctk.CTkFont(family="Tahoma", size=18, weight="bold"),
            text_color=self.colors['text_primary']
        ).pack(pady=(20, 10), padx=20, anchor="w")
        
        ctk.CTkLabel(
            about_card,
            text="Impulse Guard Dashboard v2.0",
            font=ctk.CTkFont(family="Tahoma", size=12),
            text_color=self.colors['text_secondary']
        ).pack(padx=20, anchor="w")
        
        ctk.CTkLabel(
            about_card,
            text="Built with CustomTkinter",
            font=ctk.CTkFont(family="Tahoma", size=11),
            text_color=self.colors['text_secondary']
        ).pack(padx=20, pady=(5, 20), anchor="w")
        
        self.pages["settings"] = page
        
    def create_stat_card(self, parent, title, value, icon, color):
        """Create a stat card widget"""
        card = ctk.CTkFrame(parent, fg_color=self.colors['bg_card'], corner_radius=15)
        
        # Icon
        icon_label = ctk.CTkLabel(
            card,
            text=icon,
            font=ctk.CTkFont(family="Tahoma", size=28)
        )
        icon_label.pack(pady=(15, 5))
        
        # Value
        value_label = ctk.CTkLabel(
            card,
            text=value,
            font=ctk.CTkFont(family="Tahoma", size=22, weight="bold"),
            text_color=color
        )
        value_label.pack(pady=5)
        
        # Title
        title_label = ctk.CTkLabel(
            card,
            text=title,
            font=ctk.CTkFont(family="Tahoma", size=11),
            text_color=self.colors['text_secondary']
        )
        title_label.pack(pady=(0, 15))
        
        # Store value label for updates
        card.value_label = value_label
        
        return card
        
    def draw_radar_chart(self, categories, frequencies, amounts):
        """Draw radar chart on canvas"""
        canvas = self.category_canvas
        canvas.delete("all")
        
        width = canvas.winfo_width()
        height = canvas.winfo_height()
        
        if width < 10:  # Canvas not yet sized
            width = 700
            height = 400
        
        center_x = width / 2
        center_y = height / 2
        max_radius = min(width, height) / 2 - 60
        
        # Number of categories
        n = len(categories)
        if n == 0:
            canvas.create_text(
                center_x, center_y,
                text="No data available",
                fill=self.colors['text_secondary'],
                font=("Tahoma", 14)
            )
            return
        
        # Draw concentric circles
        for i in range(1, 5):
            r = (max_radius / 4) * i
            canvas.create_oval(
                center_x - r, center_y - r,
                center_x + r, center_y + r,
                outline=self.colors['border'],
                width=1
            )
        
        # Calculate max value for scaling
        max_freq = max(frequencies) if frequencies else 1
        max_amount = max(amounts) if amounts else 1
        
        # Draw axes and labels
        for i in range(n):
            angle = (2 * math.pi * i / n) - (math.pi / 2)
            x = center_x + max_radius * math.cos(angle)
            y = center_y + max_radius * math.sin(angle)
            
            # Axis line
            canvas.create_line(
                center_x, center_y, x, y,
                fill=self.colors['border'],
                width=1
            )
            
            # Label
            label_x = center_x + (max_radius + 30) * math.cos(angle)
            label_y = center_y + (max_radius + 30) * math.sin(angle)
            canvas.create_text(
                label_x, label_y,
                text=categories[i],
                fill=self.colors['text_secondary'],
                font=("Tahoma", 10)
            )
        
        # Draw frequency polygon
        freq_points = []
        for i in range(n):
            angle = (2 * math.pi * i / n) - (math.pi / 2)
            r = (frequencies[i] / max_freq) * max_radius if max_freq > 0 else 0
            x = center_x + r * math.cos(angle)
            y = center_y + r * math.sin(angle)
            freq_points.extend([x, y])
        
        if len(freq_points) >= 6:
            canvas.create_polygon(
                freq_points,
                fill="",
                outline=self.colors['accent_cyan'],
                width=2
            )
        
        # Draw amount polygon
        amount_points = []
        normalized_amounts = [a / max_amount * max_freq if max_amount > 0 else 0 for a in amounts]
        for i in range(n):
            angle = (2 * math.pi * i / n) - (math.pi / 2)
            r = (normalized_amounts[i] / max_freq) * max_radius if max_freq > 0 else 0
            x = center_x + r * math.cos(angle)
            y = center_y + r * math.sin(angle)
            amount_points.extend([x, y])
        
        if len(amount_points) >= 6:
            canvas.create_polygon(
                amount_points,
                fill="",
                outline=self.colors['accent_orange'],
                width=2
            )
        
        # Legend
        legend_y = 30
        canvas.create_line(20, legend_y, 50, legend_y, fill=self.colors['accent_cyan'], width=2)
        canvas.create_text(60, legend_y, text="Frequency", anchor="w", fill=self.colors['text_secondary'], font=("Tahoma", 10))
        
        canvas.create_line(180, legend_y, 210, legend_y, fill=self.colors['accent_orange'], width=2)
        canvas.create_text(220, legend_y, text="Spending", anchor="w", fill=self.colors['text_secondary'], font=("Tahoma", 10))
        
    def draw_line_chart(self, canvas, data_points):
        """Draw line chart on canvas"""
        canvas.delete("all")
        
        width = canvas.winfo_width()
        height = canvas.winfo_height()
        
        if width < 10:
            width = 700
            height = 350
        
        if not data_points or len(data_points) < 2:
            canvas.create_text(
                width / 2, height / 2,
                text="Not enough data to display",
                fill=self.colors['text_secondary'],
                font=("Tahoma", 14)
            )
            return
        
        # Padding
        pad_x = 60
        pad_y = 40
        chart_width = width - 2 * pad_x
        chart_height = height - 2 * pad_y
        
        # Draw axes
        canvas.create_line(
            pad_x, height - pad_y,
            width - pad_x, height - pad_y,
            fill=self.colors['border'],
            width=2
        )
        canvas.create_line(
            pad_x, pad_y,
            pad_x, height - pad_y,
            fill=self.colors['border'],
            width=2
        )
        
        # Calculate scaling
        max_value = max(data_points) if data_points else 100
        if max_value == 0:
            max_value = 100
        
        # Draw grid lines
        for i in range(5):
            y = pad_y + (chart_height / 4) * i
            canvas.create_line(
                pad_x, y,
                width - pad_x, y,
                fill=self.colors['border'],
                dash=(2, 4)
            )
            label_value = max_value * (1 - i / 4)
            canvas.create_text(
                pad_x - 10, y,
                text=f"${label_value:.0f}",
                anchor="e",
                fill=self.colors['text_secondary'],
                font=("Tahoma", 9)
            )
        
        # Draw line
        points = []
        for i, value in enumerate(data_points):
            x = pad_x + (chart_width / (len(data_points) - 1)) * i
            y = height - pad_y - (value / max_value) * chart_height
            points.extend([x, y])
        
        if len(points) >= 4:
            canvas.create_line(
                points,
                fill=self.colors['accent_green'],
                width=3,
                smooth=True
            )
            
            # Draw points
            for i in range(0, len(points), 2):
                canvas.create_oval(
                    points[i] - 4, points[i+1] - 4,
                    points[i] + 4, points[i+1] + 4,
                    fill=self.colors['accent_green'],
                    outline=self.colors['text_primary'],
                    width=2
                )
        
    def load_stats(self):
        """Load stats from JSON file"""
        stats_file = os.path.join(os.path.dirname(__file__), 'stats.json')
        
        try:
            if os.path.exists(stats_file):
                with open(stats_file, 'r') as f:
                    self.stats = json.load(f)
            else:
                self.stats = {
                    'totalBattles': 0,
                    'victories': 0,
                    'defeats': 0,
                    'moneySaved': 0,
                    'savingsHistory': [],
                    'recentBattles': []
                }
        except Exception as e:
            print(f"Error loading stats: {e}")
            self.stats = {
                'totalBattles': 0,
                'victories': 0,
                'defeats': 0,
                'moneySaved': 0,
                'savingsHistory': [],
                'recentBattles': []
            }
        
        self.update_all_displays()
        
    def update_all_displays(self):
        """Update all display elements with current stats"""
        # Update stat cards
        self.stat_cards["Total Purchases"].value_label.configure(text=str(self.stats.get('totalBattles', 0)))
        self.stat_cards["Purchases Made"].value_label.configure(text=str(self.stats.get('victories', 0)))
        self.stat_cards["Resisted"].value_label.configure(text=str(self.stats.get('defeats', 0)))
        self.stat_cards["Money Saved"].value_label.configure(text=f"${self.stats.get('moneySaved', 0):.2f}")
        
        # Update analytics cards
        self.update_analytics_cards()
        
        # Update sidebar quick stats
        self.quick_stats_labels["Total"].configure(text=str(self.stats.get('totalBattles', 0)))
        self.quick_stats_labels["Saved"].configure(text=f"${self.stats.get('moneySaved', 0):.2f}")
        
        # Update recent purchases
        self.update_recent_purchases()
        
        # Update radar chart
        self.update_radar_chart()
        
        # Update savings chart
        self.update_savings_chart()
        
        # Update purchases page
        self.update_purchases_display()
        
        # Update savings cards
        self.update_savings_cards()
        
        # Update analytics displays
        self.update_analytics_displays()
        
    def update_analytics_cards(self):
        """Update analytics card values"""
        # Calculate current streak
        streak = self.calculate_streak()
        self.analytics_cards["Current Streak"].value_label.configure(text=f"{streak} days")
        
        # Biggest save
        recent_battles = self.stats.get('recentBattles', [])
        biggest_save = 0
        for battle in recent_battles:
            if battle['result'] == 'defeat':
                biggest_save = max(biggest_save, battle.get('amount', 0))
        self.analytics_cards["Biggest Save"].value_label.configure(text=f"${biggest_save:.2f}")
        
        # Success rate
        total = self.stats.get('totalBattles', 0)
        defeats = self.stats.get('defeats', 0)
        rate = (defeats / total * 100) if total > 0 else 0
        self.analytics_cards["Success Rate"].value_label.configure(text=f"{rate:.1f}%")
        
        # Daily average
        if recent_battles:
            days = len(set(
                datetime.fromtimestamp(b['timestamp'] / 1000).date()
                for b in recent_battles if 'timestamp' in b
            ))
            daily_avg = total / days if days > 0 else total
        else:
            daily_avg = 0
        self.analytics_cards["Daily Average"].value_label.configure(text=f"{daily_avg:.1f}")
        
    def calculate_streak(self):
        """Calculate current streak of resisted purchases"""
        recent_battles = self.stats.get('recentBattles', [])
        if not recent_battles:
            return 0
        
        # Sort by timestamp (most recent first)
        sorted_battles = sorted(
            recent_battles,
            key=lambda x: x.get('timestamp', 0),
            reverse=True
        )
        
        streak = 0
        for battle in sorted_battles:
            if battle['result'] == 'defeat':
                streak += 1
            else:
                break
        
        return streak
        
    def update_recent_purchases(self):
        """Update recent purchases list on dashboard"""
        # Clear existing
        for widget in self.recent_purchases_frame.winfo_children():
            widget.destroy()
        
        recent_battles = self.stats.get('recentBattles', [])
        if not recent_battles:
            ctk.CTkLabel(
                self.recent_purchases_frame,
                text="No purchases yet",
                font=ctk.CTkFont(family="Tahoma", size=12),
                text_color=self.colors['text_secondary']
            ).pack(pady=20)
            return
        
        # Show last 10
        for battle in reversed(recent_battles[-10:]):
            self.create_purchase_item(self.recent_purchases_frame, battle)
            
    def create_purchase_item(self, parent, battle):
        """Create a purchase item widget"""
        item_frame = ctk.CTkFrame(parent, fg_color=self.colors['bg_secondary'], corner_radius=10)
        item_frame.pack(fill="x", pady=5)
        
        # Left side - icon and description
        left_frame = ctk.CTkFrame(item_frame, fg_color="transparent")
        left_frame.pack(side="left", fill="x", expand=True, padx=15, pady=10)
        
        result = battle.get('result', 'victory')
        icon = "🛡️" if result == 'defeat' else "🛍️"
        color = self.colors['accent_green'] if result == 'defeat' else self.colors['accent_orange']
        
        ctk.CTkLabel(
            left_frame,
            text=icon,
            font=ctk.CTkFont(family="Tahoma", size=20)
        ).pack(side="left", padx=(0, 10))
        
        desc_frame = ctk.CTkFrame(left_frame, fg_color="transparent")
        desc_frame.pack(side="left", fill="x", expand=True)
        
        description = battle.get('description', battle.get('item', 'Unknown Item'))
        ctk.CTkLabel(
            desc_frame,
            text=description[:50] + "..." if len(description) > 50 else description,
            font=ctk.CTkFont(family="Tahoma", size=12),
            text_color=self.colors['text_primary']
        ).pack(anchor="w")
        
        # Timestamp
        if 'timestamp' in battle:
            dt = datetime.fromtimestamp(battle['timestamp'] / 1000)
            time_str = dt.strftime("%b %d, %Y %I:%M %p")
            ctk.CTkLabel(
                desc_frame,
                text=time_str,
                font=ctk.CTkFont(family="Tahoma", size=9),
                text_color=self.colors['text_secondary']
            ).pack(anchor="w")
        
        # Right side - result and amount
        right_frame = ctk.CTkFrame(item_frame, fg_color="transparent")
        right_frame.pack(side="right", padx=15, pady=10)
        
        result_text = "Resisted" if result == 'defeat' else "Purchased"
        ctk.CTkLabel(
            right_frame,
            text=result_text,
            font=ctk.CTkFont(family="Tahoma", size=11, weight="bold"),
            text_color=color
        ).pack(anchor="e")
        
        amount = battle.get('amount', 0)
        ctk.CTkLabel(
            right_frame,
            text=f"${amount:.2f}",
            font=ctk.CTkFont(family="Tahoma", size=12),
            text_color=self.colors['text_primary']
        ).pack(anchor="e")
        
    def update_radar_chart(self):
        """Update radar chart with category data"""
        recent_battles = self.stats.get('recentBattles', [])
        
        categories = ['Electronics', 'Fashion', 'Food', 'Entertainment', 'Home', 'Beauty', 'Fitness', 'Other']
        frequencies = [0] * 8
        amounts = [0] * 8
        
        category_map = {
            'electronics': 0, 'fashion': 1, 'food': 2, 'entertainment': 3,
            'home': 4, 'beauty': 5, 'fitness': 6, 'other': 7
        }
        
        for battle in recent_battles:
            description = battle.get('description', '').lower()
            category = self.categorize_purchase(description)
            idx = category_map.get(category, 7)
            
            frequencies[idx] += 1
            if battle['result'] == 'victory':
                amounts[idx] += battle.get('amount', 0)
        
        self.draw_radar_chart(categories, frequencies, amounts)
        
    def categorize_purchase(self, description):
        """Categorize purchase based on description"""
        description = description.lower()
        
        categories = {
            'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'watch', 'gaming'],
            'fashion': ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'clothing', 'fashion', 'apparel', 'wear', 'style'],
            'food': ['food', 'restaurant', 'meal', 'snack', 'drink', 'coffee', 'dinner', 'lunch', 'breakfast', 'grocery'],
            'entertainment': ['movie', 'game', 'book', 'music', 'concert', 'ticket', 'streaming', 'netflix', 'spotify', 'subscription'],
            'home': ['furniture', 'home', 'decor', 'kitchen', 'bedroom', 'living', 'appliance', 'tool', 'garden', 'house'],
            'beauty': ['makeup', 'cosmetic', 'skincare', 'beauty', 'perfume', 'fragrance', 'hair', 'nail', 'spa', 'lotion'],
            'fitness': ['gym', 'fitness', 'exercise', 'workout', 'sport', 'running', 'yoga', 'protein', 'supplement', 'athletic'],
        }
        
        for category, keywords in categories.items():
            if any(keyword in description for keyword in keywords):
                return category
        
        return 'other'
        
    def update_savings_chart(self):
        """Update cumulative savings chart"""
        savings_history = self.stats.get('savingsHistory', [])
        if savings_history:
            self.draw_line_chart(self.savings_canvas, savings_history)
            
    def update_purchases_display(self):
        """Update purchases list based on filter"""
        # Clear existing
        for widget in self.purchases_list_frame.winfo_children():
            widget.destroy()
        
        recent_battles = self.stats.get('recentBattles', [])
        filter_value = self.filter_var.get()
        
        # Filter battles
        if filter_value != 'all':
            filtered_battles = [b for b in recent_battles if b['result'] == filter_value]
        else:
            filtered_battles = recent_battles
        
        if not filtered_battles:
            ctk.CTkLabel(
                self.purchases_list_frame,
                text="No purchases match this filter",
                font=ctk.CTkFont(family="Tahoma", size=12),
                text_color=self.colors['text_secondary']
            ).pack(pady=20)
            return
        
        # Show all filtered purchases
        for battle in reversed(filtered_battles):
            self.create_purchase_item(self.purchases_list_frame, battle)
            
    def update_savings_cards(self):
        """Update savings page cards"""
        total_saved = self.stats.get('moneySaved', 0)
        defeats = self.stats.get('defeats', 0)
        avg_save = total_saved / defeats if defeats > 0 else 0
        
        recent_battles = self.stats.get('recentBattles', [])
        biggest_save = 0
        for battle in recent_battles:
            if battle['result'] == 'defeat':
                biggest_save = max(biggest_save, battle.get('amount', 0))
        
        self.savings_cards["Total Saved"].configure(text=f"${total_saved:.2f}")
        self.savings_cards["Average Save"].configure(text=f"${avg_save:.2f}")
        self.savings_cards["Biggest Save"].configure(text=f"${biggest_save:.2f}")
        
    def update_analytics_displays(self):
        """Update analytics page displays"""
        # Time-based analysis
        for widget in self.time_analytics_frame.winfo_children():
            widget.destroy()
        
        recent_battles = self.stats.get('recentBattles', [])
        if recent_battles:
            # Group by date
            date_counts = Counter()
            for battle in recent_battles:
                if 'timestamp' in battle:
                    dt = datetime.fromtimestamp(battle['timestamp'] / 1000)
                    date_counts[dt.date()] += 1
            
            # Show top dates
            for date, count in date_counts.most_common(5):
                date_frame = ctk.CTkFrame(self.time_analytics_frame, fg_color=self.colors['bg_secondary'], corner_radius=10)
                date_frame.pack(fill="x", pady=5)
                
                ctk.CTkLabel(
                    date_frame,
                    text=date.strftime("%b %d, %Y"),
                    font=ctk.CTkFont(family="Tahoma", size=12),
                    text_color=self.colors['text_primary']
                ).pack(side="left", padx=15, pady=10)
                
                ctk.CTkLabel(
                    date_frame,
                    text=f"{count} purchases",
                    font=ctk.CTkFont(family="Tahoma", size=11, weight="bold"),
                    text_color=self.colors['accent_cyan']
                ).pack(side="right", padx=15, pady=10)
        
        # Category breakdown
        for widget in self.category_breakdown_frame.winfo_children():
            widget.destroy()
        
        if recent_battles:
            category_counts = Counter()
            for battle in recent_battles:
                description = battle.get('description', '').lower()
                category = self.categorize_purchase(description)
                category_counts[category] += 1
            
            for category, count in category_counts.most_common():
                cat_frame = ctk.CTkFrame(self.category_breakdown_frame, fg_color=self.colors['bg_secondary'], corner_radius=10)
                cat_frame.pack(fill="x", pady=5)
                
                ctk.CTkLabel(
                    cat_frame,
                    text=category.capitalize(),
                    font=ctk.CTkFont(family="Tahoma", size=12),
                    text_color=self.colors['text_primary']
                ).pack(side="left", padx=15, pady=10)
                
                # Progress bar
                progress = count / len(recent_battles)
                bar_width = int(progress * 200)
                
                progress_frame = ctk.CTkFrame(cat_frame, fg_color=self.colors['bg_dark'], corner_radius=5, height=20)
                progress_frame.pack(side="left", padx=10, fill="x", expand=True)
                
                bar = ctk.CTkFrame(progress_frame, fg_color=self.colors['accent_cyan'], corner_radius=5, width=bar_width, height=16)
                bar.pack(side="left", padx=2, pady=2)
                
                ctk.CTkLabel(
                    cat_frame,
                    text=f"{count}",
                    font=ctk.CTkFont(family="Tahoma", size=11, weight="bold"),
                    text_color=self.colors['accent_cyan']
                ).pack(side="right", padx=15, pady=10)
        
    def switch_page(self, page_name):
        """Switch to a different page"""
        self.current_page = page_name
        self.show_page(page_name)
        self.highlight_nav_button(page_name)
        
    def show_page(self, page_name):
        """Show the specified page"""
        # Hide all pages
        for page in self.pages.values():
            page.grid_remove()
        
        # Show selected page
        if page_name in self.pages:
            self.pages[page_name].grid(row=0, column=0, sticky="nsew", padx=0, pady=0)
            self.scroll_frame._parent_canvas.yview_moveto(0)  # Scroll to top
        
    def highlight_nav_button(self, page_name):
        """Highlight the active navigation button"""
        for name, btn in self.nav_buttons.items():
            if name == page_name:
                btn.configure(
                    fg_color=self.colors['bg_card'],
                    text_color=self.colors['accent_cyan']
                )
            else:
                btn.configure(
                    fg_color="transparent",
                    text_color=self.colors['text_secondary']
                )
        
    def change_theme(self, theme):
        """Change application theme"""
        theme_map = {
            "Dark": "dark",
            "Light": "light",
            "System": "system"
        }
        ctk.set_appearance_mode(theme_map.get(theme, "dark"))
        
    def export_data(self):
        """Export data to file"""
        print("Exporting data...")
        # TODO: Implement export functionality
        
    def clear_data(self):
        """Clear all data"""
        print("Clearing data...")
        # TODO: Implement clear data with confirmation dialog
        
    def refresh_data(self):
        """Refresh data from file"""
        self.load_stats()

def main():
    app = ModernDashboard()
    app.mainloop()

if __name__ == "__main__":
    main()
