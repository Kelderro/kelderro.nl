#!/usr/bin/env node
// Reads and rolls back the live production deployment of the Cloudflare Pages
// project, through the Pages API (ADR 0011).
//
//   node scripts/pages-production.mjs live
//       Prints the ID of the deployment that is live in production.
//   node scripts/pages-production.mjs rollback [deployment-id]
//       Makes that deployment live again. Without an ID, the newest successful
//       production deployment that is older than the live one.
//
// Needs CLOUDFLARE_API_TOKEN (Account > Cloudflare Pages > Edit) and
// CLOUDFLARE_ACCOUNT_ID. PAGES_PROJECT defaults to kelderro-nl. In GitHub
// Actions the results are also written to $GITHUB_OUTPUT.

import { appendFileSync } from 'node:fs';

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;
const project = process.env.PAGES_PROJECT || 'kelderro-nl';

if (!token || !accountId) {
    console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set.');
    process.exit(2);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}`;

async function api(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success) {
        const errors = (body.errors ?? []).map(e => `${e.code}: ${e.message}`).join('; ');
        throw new Error(`${options.method ?? 'GET'} ${path} failed (${response.status}) ${errors}`);
    }
    return body.result;
}

const describe = d =>
    `${d.id} (commit ${d.deployment_trigger?.metadata?.commit_hash?.slice(0, 7) ?? 'unknown'}, ${d.created_on})`;

const isRollbackTarget = d =>
    d.environment === 'production' && d.latest_stage?.status === 'success';

function output(values) {
    if (!process.env.GITHUB_OUTPUT) return;
    for (const [key, value] of Object.entries(values)) {
        appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value ?? ''}\n`);
    }
}

async function live() {
    const { canonical_deployment: deployment } = await api('');
    if (!deployment) throw new Error('The project has no live production deployment.');
    return deployment;
}

async function rollback(targetId) {
    const current = await live();
    let target;
    if (targetId) {
        target = await api(`/deployments/${targetId}`);
    } else {
        const deployments = await api('/deployments?env=production&per_page=25');
        deployments.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
        target = deployments.find(
            d => isRollbackTarget(d) && new Date(d.created_on) < new Date(current.created_on)
        );
        if (!target) throw new Error(`No successful production deployment before ${current.id}.`);
    }
    if (!isRollbackTarget(target)) {
        throw new Error(`${describe(target)} is not a successful production deployment.`);
    }

    const values = {
        previous_id: current.id,
        previous_commit: current.deployment_trigger?.metadata?.commit_hash,
        deployment_id: target.id,
        commit: target.deployment_trigger?.metadata?.commit_hash,
        url: target.url,
    };
    if (target.id === current.id) {
        console.log(`${describe(target)} is already live. Nothing to roll back.`);
    } else {
        await api(`/deployments/${target.id}/rollback`, { method: 'POST' });
        console.log(`Rolled back production from ${describe(current)} to ${describe(target)}.`);
    }
    output(values);
}

const [command, argument] = process.argv.slice(2);
try {
    if (command === 'live') {
        const deployment = await live();
        console.log(deployment.id);
        output({ deployment_id: deployment.id });
    } else if (command === 'rollback') {
        await rollback(argument);
    } else {
        console.error('Usage: pages-production.mjs live | rollback [deployment-id]');
        process.exit(2);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
