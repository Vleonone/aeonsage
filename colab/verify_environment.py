#!/usr/bin/env python3
"""
AeonSage Colab 环境验证脚本
运行此脚本来验证 Colab 环境配置是否正确
"""

import os
import sys
import subprocess
import json
import platform
from typing import Dict, List, Tuple

class ColabEnvironmentChecker:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
    
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """记录测试结果"""
        status = "✓" if passed else "✗"
        self.results.append((test_name, passed, message))
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print(f"{status} {test_name}: {message}")
    
    def run_command(self, command: List[str]) -> Tuple[bool, str]:
        """执行命令并返回结果"""
        try:
            result = subprocess.run(
                command, 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            return result.returncode == 0, result.stdout.strip()
        except subprocess.TimeoutExpired:
            return False, "命令执行超时"
        except Exception as e:
            return False, f"执行错误: {str(e)}"
    
    def check_system_info(self):
        """检查系统信息"""
        print("=== 系统信息检查 ===")
        
        # 检查 Python 版本
        python_version = sys.version.split()[0]
        self.log_result("Python 版本", True, python_version)
        
        # 检查平台
        platform_info = platform.platform()
        self.log_result("操作系统", True, platform_info)
        
        # 检查架构
        architecture = platform.architecture()[0]
        self.log_result("系统架构", True, architecture)
        
        # 检查 GPU
        gpu_available = 'COLAB_GPU' in os.environ
        gpu_status = "可用" if gpu_available else "不可用"
        self.log_result("GPU 支持", gpu_available, gpu_status)
        
        # 检查磁盘空间
        try:
            result = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    disk_info = lines[1].split()
                    if len(disk_info) > 3:
                        used, available = disk_info[2], disk_info[3]
                        self.log_result("磁盘空间", True, f"已用: {used}, 可用: {available}")
        except:
            self.log_result("磁盘空间", False, "无法获取磁盘信息")
    
    def check_node_environment(self):
        """检查 Node.js 环境"""
        print("\n=== Node.js 环境检查 ===")
        
        # 检查 Node.js
        success, version = self.run_command(['node', '--version'])
        self.log_result("Node.js 安装", success, version if success else "未安装")
        
        # 检查 npm
        success, version = self.run_command(['npm', '--version'])
        self.log_result("npm 安装", success, version if success else "未安装")
        
        # 检查 pnpm
        success, version = self.run_command(['pnpm', '--version'])
        self.log_result("pnpm 安装", success, version if success else "未安装")
        
        # 检查 Git
        success, version = self.run_command(['git', '--version'])
        self.log_result("Git 安装", success, version if success else "未安装")
    
    def check_aeonsage_installation(self):
        """检查 AeonSage 安装"""
        print("\n=== AeonSage 安装检查 ===")
        
        # 检查项目目录
        project_exists = os.path.exists('aeonsage') and os.path.isdir('aeonsage')
        self.log_result("项目目录", project_exists, "aeonsage" if project_exists else "未找到")
        
        if not project_exists:
            return
        
        # 切换到项目目录
        original_dir = os.getcwd()
        os.chdir('aeonsage')
        
        try:
            # 检查 package.json
            package_exists = os.path.exists('package.json')
            self.log_result("package.json", package_exists, "存在" if package_exists else "缺失")
            
            if package_exists:
                # 检查依赖安装
                node_modules_exists = os.path.exists('node_modules')
                self.log_result("依赖安装", node_modules_exists, "已完成" if node_modules_exists else "需要运行 pnpm install")
                
                # 检查构建输出
                dist_exists = os.path.exists('dist')
                self.log_result("构建输出", dist_exists, "已构建" if dist_exists else "需要运行 pnpm build")
                
                # 检查 CLI 工具
                if dist_exists:
                    success, version = self.run_command(['pnpm', 'aeonsage', '--version'])
                    self.log_result("CLI 工具", success, version if success else "无法执行")
                    
                    # 检查帮助命令
                    success, _ = self.run_command(['pnpm', 'aeonsage', '--help'])
                    self.log_result("CLI 帮助", success, "可用" if success else "不可用")
        
        finally:
            # 恢复原始目录
            os.chdir(original_dir)
    
    def check_network_connectivity(self):
        """检查网络连接"""
        print("\n=== 网络连接检查 ===")
        
        # 检查互联网连接
        success, _ = self.run_command(['ping', '-c', '1', '8.8.8.8'])
        self.log_result("互联网连接", success, "正常" if success else "异常")
        
        # 检查 GitHub 连接
        success, _ = self.run_command(['curl', '-s', 'https://github.com', '--max-time', '10'])
        self.log_result("GitHub 连接", success, "可访问" if success else "无法访问")
        
        # 检查 npm registry
        success, _ = self.run_command(['npm', 'ping'])
        self.log_result("npm Registry", success, "响应正常" if success else "无响应")
    
    def run_comprehensive_test(self):
        """运行完整测试套件"""
        print("🤖 AeonSage Colab 环境验证")
        print("=" * 50)
        
        # 执行各项检查
        self.check_system_info()
        self.check_node_environment()
        self.check_aeonsage_installation()
        self.check_network_connectivity()
        
        # 输出总结
        print("\n" + "=" * 50)
        print(f"📊 测试总结: {self.passed} 通过, {self.failed} 失败")
        print(f"📈 成功率: {self.passed/(self.passed + self.failed)*100:.1f}%")
        
        # 详细结果
        print("\n📋 详细结果:")
        for test_name, passed, message in self.results:
            status = "PASS" if passed else "FAIL"
            print(f"  {status:4} | {test_name:20} | {message}")
        
        # 环境状态评估
        print("\n🎯 环境状态:")
        critical_checks = [
            result[1] for result in self.results 
            if result[0] in ["Node.js 安装", "pnpm 安装", "项目目录", "依赖安装", "构建输出"]
        ]
        
        if all(critical_checks):
            print("  ✅ 环境配置完整，可以开始使用 AeonSage")
            return True
        elif any(critical_checks):
            print("  ⚠️  环境部分配置，需要修复")
            return False
        else:
            print("  ❌ 环境未配置，请运行安装脚本")
            return False

def main():
    """主函数"""
    checker = ColabEnvironmentChecker()
    success = checker.run_comprehensive_test()
    
    if not success:
        print("\n💡 建议修复步骤:")
        print("1. 运行 !bash colab/quick_setup.sh")
        print("2. 或在 Colab 中逐个执行 setup_colab.ipynb 的单元格")
        print("3. 检查网络连接和磁盘空间")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())