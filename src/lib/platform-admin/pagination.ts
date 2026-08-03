const allowedPageSizes = new Set([10, 20, 50, 100]);

export function adminPagination(pageValue?: string, limitValue?: string) {
    const requestedPage = Number(pageValue);
    const requestedLimit = Number(limitValue);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = allowedPageSizes.has(requestedLimit) ? requestedLimit : 10;
    return { page, pageSize, offset: (page - 1) * pageSize };
}
