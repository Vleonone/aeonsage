#!/bin/bash
set -e

# ==========================================
# AEONSAGE PRO: BuyVM Node Initializer
# ==========================================
# Target: Debian 12 / Ubuntu 22.04
# Effect: Partitions Disk (LVM), Installs Docker, Deploys AeonSage

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}>>> Starting AeonSage Node Initialization...${NC}"

# 1. Update & Dependencies
apt-get update && apt-get install -y lvm2 curl git ufw fail2ban

# 2. Disk Partitioning (Optimization for future expansion)
# We assume /dev/sdb is the attached storage block (BuyVM Slab)
# OR if single disk, we assume we re-partition. 
# SAFETY: We only touch secondary block if exists, else we use folders.

if [ -b "/dev/sdb" ]; then
    echo -e "${GREEN}>>> Configuring Storage Slab (/dev/sdb)...${NC}"
    pvcreate /dev/sdb
    vgcreate vg_aeon /dev/sdb
    
    # 50GB for Application
    lvcreate -L 50G -n lv_app vg_aeon
    mkfs.ext4 /dev/vg_aeon/lv_app
    mkdir -p /opt/aeonsage
    echo "/dev/vg_aeon/lv_app /opt/aeonsage ext4 defaults 0 0" >> /etc/fstab
    mount -a
    
    # 30GB for Docker
    lvcreate -L 30G -n lv_docker vg_aeon
    mkfs.ext4 /dev/vg_aeon/lv_docker
    mkdir -p /var/lib/docker
    echo "/dev/vg_aeon/lv_docker /var/lib/docker ext4 defaults 0 0" >> /etc/fstab
    
    # Remaining space (~70GB) LEFT UNALLOCATED for future use.
else
    echo -e "${RED}>>> No secondary Block Storage found. Using root filesystem.${NC}"
    mkdir -p /opt/aeonsage
fi

# 3. Security Hardening
echo -e "${GREEN}>>> Hardening Firewall...${NC}"
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 18789/tcp
echo "y" | ufw enable

# 4. Install Docker (Stable Method)
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}>>> Installing Docker (Stable)...${NC}"
    apt-get install -y docker.io docker-compose
    systemctl enable --now docker
fi

# 5. Deploy AeonSage Pro (Placeholder for Private Repo)
echo -e "${GREEN}>>> Pulling AeonSage Pro...${NC}"
mkdir -p /opt/aeonsage
echo "AeonSage Pro Node Ready." > /opt/aeonsage/status.txt

# 6. SSH Key Management (The "Golden Key")
echo -e "${GREEN}>>> Configuring Secure Access...${NC}"
if [ ! -f /root/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -N "" -C "ceo@aeonsage.pro"
    cat /root/.ssh/id_ed25519.pub >> /root/.ssh/authorized_keys
fi

echo -e "${GREEN}════════ AEONSAGE PRO MASTER KEY ════════${NC}"
echo -e "${RED}SAVE THIS KEY IMMEDIATELY! It is your ONLY access credential.${NC}"
echo ""
cat /root/.ssh/id_ed25519
echo ""
echo -e "${GREEN}═════════════════════════════════════════${NC}"

echo -e "${GREEN}>>> DONE! Node is ready via Key-Based Auth.${NC}"
