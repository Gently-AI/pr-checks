import {minimatch} from 'minimatch';

export function matchesPathFilters(changedPaths: string[], pathFilters: string[]): boolean {
    return changedPaths.some((changedPath) => {
        const positiveFilters = pathFilters.filter((f) => !f.startsWith('!'));
        const negativeFilters = pathFilters.filter((f) => f.startsWith('!')).map((f) => f.slice(1));

        if (positiveFilters.length === 0) {
            return false;
        }

        const matchesPositive = positiveFilters.some((filter) => minimatch(changedPath, filter));

        if (!matchesPositive) {
            return false;
        }

        const excludedByNegative = negativeFilters.some((filter) => minimatch(changedPath, filter));

        return !excludedByNegative;
    });
}

export function shouldSkipWorkflow(
    changedPaths: string[],
    paths?: string[],
    pathsIgnore?: string[]
): boolean {
    if (paths && paths.length > 0) {
        return !matchesPathFilters(changedPaths, paths);
    }

    if (pathsIgnore && pathsIgnore.length > 0) {
        if (changedPaths.length === 0) {
            return false;
        }
        const allIgnored = changedPaths.every((changedPath) =>
            pathsIgnore.some((pattern) => minimatch(changedPath, pattern))
        );
        return allIgnored;
    }

    return false;
}
