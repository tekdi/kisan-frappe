app_name = "kisan_warehouse"
app_title = "Kisan Warehouse"
app_publisher = "Deepak Patil"
app_description = "KisanMitra Warehouse Management System"
app_email = "deepak_p@tekditechnologies.com"
app_license = "mit"

# Export Enhanced fixtures
fixtures = [
    # Core DocTypes
    {
        "dt": "DocType", 
        "filters": [
            ["name", "in", [
                "Company", "Customer", "Product", "Broker", "Warehouse", "Vehicle", 
                "Sauda", "Inward", "Inward Deduction", "App Settings", "Settings Deduction Type"
            ]]
        ]
    },
    
    # Module Definitions
    {
        "dt": "Module Def",
        "filters": [
            ["name", "in", [
                "company", "customers", "products", "brokers", "warehouses", 
                "vehicles", "saudas", "inwards", "settings"
            ]]
        ]
    },
    
    # Workspace
    {
        "dt": "Workspace",
        "filters": [
            ["name", "=", "Kisan Warehouse"]
        ]
    },
    
    # Client Scripts (JavaScript that runs in browser)
    {
        "dt": "Client Script",
        "filters": [
            ["dt", "in", [
                "Company", "Customer", "Product", "Broker", "Warehouse", "Vehicle", 
                "Sauda", "Inward", "Inward Deduction", "App Settings"
            ]]
        ]
    },
    
    # Custom Fields (if any)
    {
        "dt": "Custom Field",
        "filters": [
            ["dt", "in", [
                "Company", "Customer", "Product", "Broker", "Warehouse", "Vehicle", 
                "Sauda", "Inward", "App Settings"
            ]]
        ]
    },
    
    # Property Setter (for field customizations)
    {
        "dt": "Property Setter",
        "filters": [
            ["doc_type", "in", [
                "Company", "Customer", "Product", "Broker", "Warehouse", "Vehicle", 
                "Sauda", "Inward", "App Settings"
            ]]
        ]
    },
    
  # Print format   
{
    "dt": "Print Format",
	"filters": [
		    ["doc_type", "in", [
		        "Company", "Customer", "Product", "Broker", "Warehouse", "Vehicle", 
		        "Sauda", "Inward", "App Settings"
		    ]]
		]
	},

    # Reports
    {"dt": "Report", "filters": [["module", "in", ["Saudas", "Inwards", "Products", "Warehouses"]]]},

    # Notifications
    {
        "dt": "Notification",
        "filters": [["name", "in", ["Sauda Saved"]]]
    }
    
]


# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "kisan_warehouse",
# 		"logo": "/assets/kisan_warehouse/logo.png",
# 		"title": "Kisan Warehouse",
# 		"route": "/kisan_warehouse",
# 		"has_permission": "kisan_warehouse.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/kisan_warehouse/css/kisan_warehouse.css"
# app_include_js = "/assets/kisan_warehouse/js/kisan_warehouse.js"

# include js, css files in header of web template
# web_include_css = "/assets/kisan_warehouse/css/kisan_warehouse.css"
# web_include_js = "/assets/kisan_warehouse/js/kisan_warehouse.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "kisan_warehouse/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "kisan_warehouse/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "kisan_warehouse.utils.jinja_methods",
# 	"filters": "kisan_warehouse.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "kisan_warehouse.install.before_install"
# after_install = "kisan_warehouse.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "kisan_warehouse.uninstall.before_uninstall"
# after_uninstall = "kisan_warehouse.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "kisan_warehouse.utils.before_app_install"
# after_app_install = "kisan_warehouse.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "kisan_warehouse.utils.before_app_uninstall"
# after_app_uninstall = "kisan_warehouse.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "kisan_warehouse.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"kisan_warehouse.tasks.all"
# 	],
# 	"daily": [
# 		"kisan_warehouse.tasks.daily"
# 	],
# 	"hourly": [
# 		"kisan_warehouse.tasks.hourly"
# 	],
# 	"weekly": [
# 		"kisan_warehouse.tasks.weekly"
# 	],
# 	"monthly": [
# 		"kisan_warehouse.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "kisan_warehouse.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "kisan_warehouse.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "kisan_warehouse.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["kisan_warehouse.utils.before_request"]
# after_request = ["kisan_warehouse.utils.after_request"]

# Job Events
# ----------
# before_job = ["kisan_warehouse.utils.before_job"]
# after_job = ["kisan_warehouse.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"kisan_warehouse.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

