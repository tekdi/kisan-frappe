# 🌾 Agri Warehouse Management System

A comprehensive Frappe-based warehouse management solution designed specifically for agricultural businesses. This open-source application streamlines warehouse operations including customer management, broker coordination, product tracking, vehicle management, warehouse inwarding, and booking (sauda) processes.

## 🚀 Features

- **Customer Management**: Complete customer profile management with contact details and transaction history
- **Broker Coordination**: Streamlined broker operations and commission tracking
- **Product Management**: Comprehensive agricultural product catalog and specifications
- **Vehicle Management**: Fleet tracking and logistics coordination
- **Warehouse Inwarding**: Efficient goods receipt and inspection workflows
- **Sauda (Booking) System**: Advanced booking management for agricultural commodities
- **Real-time Inventory**: Live stock tracking across multiple warehouse locations
- **Quality Control**: Built-in quality assessment and grading systems
- **Reports & Analytics**: Comprehensive reporting for operational insights
- **Multi-warehouse Support**: Manage multiple warehouse locations seamlessly

## 📦 App Structure

- Built using **Frappe v15** framework
- Modular app architecture organized by business functions
- Clean separation of concerns for maintainability
- Extensible architecture for custom modifications

```
agri_warehouse/
├── agri_warehouse/
│   ├── brokers/                    # Broker management
│   ├── company/                    # Company settings
│   ├── config/                     # App configuration
│   ├── customers/                  # Customer management
│   ├── fixtures/                   # Default data
│   ├── inwards/                    # Inward processes
│   ├── products/                   # Product catalog
│   ├── public/                     # Static assets
│   ├── saudas/                     # Booking/Sauda system
│   ├── settings/                   # System settings
│   ├── templates/                  # Custom templates
│   ├── vehicles/                   # Vehicle management
│   ├── warehouses/                 # Warehouse operations
│   ├── hooks.py                    # App hooks
│   └── patches.txt                 # Database patches
├── requirements.txt                # Python dependencies
├── setup.py                       # App setup
├── license.txt                     # License file
└── README.md                      # This file
```

## 🔧 Prerequisites

Ensure the following are already installed and configured globally. If NOT please install these with recommended versions:

| **Package** | **Recommended Version / Notes** |
|-------------|--------------------------------|
| **Python** | 3.10.x (use pyenv or system Python) |
| **Node.js** | v18.x (LTS) |
| **npm** | v10.x |
| **Yarn** | Installed globally (`npm install -g yarn`) |
| **MariaDB** | v10.6+ (with root access) |
| **Redis** | Installed and running (`redis-server`) |
| **wkhtmltopdf** | With Qt patched version |
| **Frappe Bench** | v5.x (e.g. `bench --version` → 5.25.7+) |

### System Requirements
- **Operating System**: Ubuntu 20.04+, Debian 11+, macOS 10.15+, or Windows with WSL2
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: At least 10GB free disk space

### Verify Prerequisites Installation
```bash
# Check versions
python3 --version        # Should show 3.10.x
node --version          # Should show v18.x
npm --version           # Should show v10.x
yarn --version          # Should be installed
mysql --version         # Should show MariaDB 10.6+
redis-cli ping          # Should return PONG
bench --version         # Should show 5.x
wkhtmltopdf --version   # Should be installed with Qt
```

## 🚀 Installation Guide

### Step 1: Create New Bench (If you don't have one)
```bash
# Initialize new bench with Frappe v15
bench init agri-bench --frappe-branch version-15

# Navigate to bench directory
cd agri-bench
```

### Step 2: Create Site
```bash
# Create new site (replace with your domain)
bench new-site agri.local

# You'll be prompted to set MySQL root password and Administrator password
```

### Step 3: Get and Install Agri Warehouse App
```bash
# Get the app from repository
bench get-app https://github.com/tekdi/agri-warehouse.git

# Install app on your site
bench --site agri.local install-app agri_warehouse

# Start the development server
bench start
```

### Step 4: Access Your Application
Open your browser and navigate to:
- **URL**: `http://agri.local:8000`
- **Username**: Administrator
- **Password**: (Password you set during site creation)

## 🛠️ Development Setup

### For Existing Frappe Bench
If you already have a Frappe bench set up:

```bash
# Navigate to your bench
cd your-bench/apps/

# Clone the repository
git clone https://github.com/tekdi/agri-warehouse.git

# Navigate back to bench root
cd ..

# Install on your site
bench --site <yoursite> install-app agri_warehouse

# Migrate database
bench --site <yoursite> migrate

# Clear cache and build assets
bench --site <yoursite> clear-cache
bench build

# Start development server
bench start
```