import path from 'node:path';
import fs from 'node:fs';

import * as yaml from 'js-yaml';
import * as core from '@actions/core';

export interface WorkflowConfig {
    on?: {
        pull_request?: {
            paths?: string[];
        };
    };
    jobs?: Record<string, { name?: string }>;
}

export interface WorkflowInfo {
    file: string;
    jobs: string[];
    config: WorkflowConfig;
}

export function getWorkflowJobs(workflowDir?: string): Record<string, WorkflowInfo> {
    const workflowJobs: Record<string, WorkflowInfo> = {};
    const dir = workflowDir ?? path.join(process.cwd(), '.github', 'workflows');

    try {
        const entries = fs.readdirSync(dir);
        const workflowFiles = entries.filter(entry => entry.endsWith('.yml') || entry.endsWith('.yaml'));
        for (const workflowFile of workflowFiles) {
            const content = fs.readFileSync(path.join(dir, workflowFile), 'utf8');
            const config = yaml.load(content) as WorkflowConfig;
            const jobs = config.jobs ?? {};
            workflowJobs[workflowFile] = {
                file: workflowFile,
                jobs: Object.keys(jobs).map(job => jobs[job]?.name ?? job),
                config
            };
        }
    } catch (error) {
        core.warning(`Failed to read workflows: ${error}`);
    }

    return workflowJobs;
}
