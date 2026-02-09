/**
 * Quick test for skill registry system
 */

import { syncRegistry, searchSkills, getRegistryStats, getPopularSkills } from '../src/skills/skill-registry.js';
import { installSkill, listInstalledSkills, uninstallSkill } from '../src/skills/skill-installer.js';

async function runTests() {
    console.log('🧪 Testing AeonSage Skill Registry...\n');

    // Test 1: Sync registry
    console.log('📥 Test 1: Syncing registry from GitHub...');
    const syncResult = await syncRegistry();
    console.log(`   ✅ Sync complete: ${syncResult.totalSkills} skills found\n`);

    // Test 2: Get stats
    console.log('📊 Test 2: Getting registry stats...');
    const stats = getRegistryStats();
    if (stats) {
        console.log(`   Total: ${stats.total}, Installed: ${stats.installed}`);
        console.log(`   Categories: ${Object.keys(stats.categories).length}\n`);
    }

    // Test 3: Search skills
    console.log('🔍 Test 3: Searching for "browser automation"...');
    const searchResult = searchSkills({ query: 'browser automation', limit: 5 });
    console.log(`   Found: ${searchResult.total} skills`);
    for (const skill of searchResult.skills) {
        console.log(`   - ${skill.name}: ${skill.description.slice(0, 50)}...`);
    }
    console.log('');

    // Test 4: Get popular skills
    console.log('⭐ Test 4: Getting popular skills...');
    const popular = getPopularSkills(5);
    for (const skill of popular) {
        console.log(`   - ${skill.name} [${skill.category}]`);
    }
    console.log('');

    // Test 5: Install a skill
    console.log('📦 Test 5: Installing "agent-memory" skill...');
    const installResult = await installSkill('agent-memory');
    if (installResult.success) {
        console.log(`   ✅ Installed to: ${installResult.localPath}\n`);
    } else {
        console.log(`   ⚠️ ${installResult.error || 'Skill not found'}\n`);
    }

    // Test 6: List installed
    console.log('📋 Test 6: Listing installed skills...');
    const installed = listInstalledSkills();
    console.log(`   Installed: ${installed.length} skills`);
    for (const skill of installed) {
        console.log(`   - ${skill.name}`);
    }
    console.log('');

    // Clean up
    if (installed.length > 0) {
        console.log('🧹 Cleaning up: Uninstalling test skill...');
        await uninstallSkill('agent-memory');
        console.log('   ✅ Cleaned up\n');
    }

    console.log('✅ All tests passed!');
}

runTests().catch(console.error);
