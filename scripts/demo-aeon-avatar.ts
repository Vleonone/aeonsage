/**
 * AeonSage 表情系统演示
 */
import { aeonLog, aeonProgress, AEON_FACES, type AeonMood } from "../src/terminal/aeon-avatar.js";

console.log("\n🎨 AeonSage 终端形象演示\n");
console.log("═".repeat(50));

// 1. 展示所有表情状态
console.log("\n【表情状态库】");
const moods: AeonMood[] = ["idle", "thinking", "happy", "working", "error", "sleeping", "scanning", "crazy"];

moods.forEach(mood => {
  console.log(aeonLog(mood, `${mood.toUpperCase()}: ${AEON_FACES[mood]}`));
});

// 2. 模拟工作流程
console.log("\n【工作流程演示】");
console.log(aeonLog("idle", "等待任务..."));
setTimeout(() => {
  console.log(aeonLog("scanning", "扫描项目文件..."));
}, 500);

setTimeout(() => {
  console.log(aeonProgress("working", 30, "编译中..."));
}, 1000);

setTimeout(() => {
  console.log(aeonProgress("working", 60, "运行测试..."));
}, 1500);

setTimeout(() => {
  console.log(aeonProgress("thinking", 85, "优化代码..."));
}, 2000);

setTimeout(() => {
  console.log(aeonProgress("happy", 100, "完成!"));
  console.log(aeonLog("happy", "所有任务已完成! ✨"));
}, 2500);

// 3. ASCII机器人
setTimeout(() => {
  console.log("\n【ASCII机器人形象】");
  console.log(`
         ╔═══╗
         ║ ♡ ♡ ║     永恒智慧守护者
         ║  ▽  ║     Eternal Sage Guardian
         ╚═══╝
        ╱     ╲
       ╱ ◈ ◈ ◈ ╲
      └─────────┘
  `);
  console.log("═".repeat(50));
}, 3000);
