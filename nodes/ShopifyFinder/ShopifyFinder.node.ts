import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const ACTOR_ID = 'apivault_labs~website-leads-database';
const API_BASE = 'https://api.apify.com/v2';
const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);

const splitList = (value: string): string[] =>
	value.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);

const sleep = async (milliseconds: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

export class ShopifyFinder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Website Leads Database',
		name: 'shopifyFinder',
		icon: 'file:shopifyfinder.svg',
		group: ['transform'],
		version: 1,
		description: 'Find ecommerce and business websites by platform, country, contacts, technology and firmographic signals.',
		defaults: { name: 'Website Leads Database' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'apifyApi', required: true }],
		properties: [
			{
				displayName: 'Platforms', name: 'platforms', type: 'multiOptions',
				options: [
					{ name: 'All Platforms', value: 'all' },
					{ name: 'Angular', value: 'angular_sites' },
					{ name: 'ASP.NET', value: 'aspnet_sites' },
					{ name: 'BigCommerce', value: 'bigcommerce_sites' },
					{ name: 'Joomla', value: 'joomla_sites' },
					{ name: 'Magento', value: 'magento_sites' },
					{ name: 'Mailchimp', value: 'mailchimp_sites' },
					{ name: 'Mastercard', value: 'mastercard_sites' },
					{ name: 'PrestaShop', value: 'prestashop_sites' },
					{ name: 'Shopify', value: 'shopify_sites' },
					{ name: 'Squarespace', value: 'squarespace_addtocart_sites' },
					{ name: 'Wix', value: 'wix_sites' },
					{ name: 'WooCommerce', value: 'woocommerce_sites' },
					{ name: 'WooCommerce Checkout', value: 'woocommerce_checkout_sites' },
					{ name: 'WordPress', value: 'wordpress_sites' },
				],
				default: ['all'],
				description: 'Platform datasets to search. Select All Platforms for the complete database.',
			},
			{
				displayName: 'Keyword', name: 'keyword', type: 'string', default: '', placeholder: 'skincare',
				description: 'Substring to match in the domain or company name',
			},
			{
				displayName: 'Countries (ISO-2)', name: 'country', type: 'string', default: '', placeholder: 'US, GB, DE',
				description: 'Comma-separated or one per line. Leave empty for all countries.',
			},
			{
				displayName: 'Phone Country Code', name: 'phoneCode', type: 'string', default: '', placeholder: '+1',
				description: 'Keep sites with at least one phone starting with this code',
			},
			{
				displayName: 'Only With Email', name: 'hasEmail', type: 'boolean', default: false,
				description: 'Whether to return only sites with a public email',
			},
			{
				displayName: 'Only With Phone', name: 'hasPhone', type: 'boolean', default: false,
				description: 'Whether to return only sites with a public telephone number',
			},
			{
				displayName: 'Extra Filters', name: 'extraFilters', type: 'fixedCollection',
				typeOptions: { multipleValues: true }, placeholder: 'Add Filter', default: {},
				description: 'Conditions are combined with AND and can target any output column',
				options: [{
					displayName: 'Condition', name: 'conditions',
					values: [
						{
							displayName: 'Column', name: 'column', type: 'string', default: '', placeholder: 'City',
							description: 'Exact column name, for example City, Employees, Sales Revenue, or CMS Platform',
						},
						{
							displayName: 'Operator', name: 'operator', type: 'options', default: 'contains',
							options: [
								{ name: 'Contains', value: 'contains' },
								{ name: 'Does Not Contain', value: 'not_contains' },
								{ name: 'Ends With', value: 'ends_with' },
								{ name: 'Equals', value: 'equals' },
								{ name: 'Is Empty', value: 'empty' },
								{ name: 'Is Not Empty', value: 'not_empty' },
								{ name: 'Is One of List', value: 'in_list' },
								{ name: 'Not Equals', value: 'not_equals' },
								{ name: 'Starts With', value: 'starts_with' },
							],
						},
						{
							displayName: 'Value', name: 'value', type: 'string', default: '',
							description: 'For list matching, provide comma-separated values. Empty operators ignore this field.',
						},
					],
				}],
			},
			{
				displayName: 'Output Columns', name: 'columns', type: 'string', typeOptions: { rows: 4 }, default: '',
				placeholder: 'Root Domain\nCompany\nEmails\nTelephones',
				description: 'Comma-separated or one exact column name per line. Leave empty for all available columns.',
			},
			{
				displayName: 'Sort By', name: 'sortBy', type: 'options', default: '',
				options: [
					{ name: 'No Sorting', value: '' }, { name: 'Employees', value: 'Employees' },
					{ name: 'Last Found', value: 'Last Found' }, { name: 'Overall Score', value: 'Overall Score' },
					{ name: 'Page Rank', value: 'Page Rank' }, { name: 'Performance', value: 'Performance' },
					{ name: 'Sales Revenue', value: 'Sales Revenue' }, { name: 'SEO', value: 'SEO' },
					{ name: 'SKU', value: 'SKU' }, { name: 'Technology Spend', value: 'Technology Spend' },
					{ name: 'Tranco', value: 'Tranco' },
				],
				description: 'Sort before applying the row limit to receive the strongest leads first',
			},
			{
				displayName: 'Sort Descending', name: 'sortDesc', type: 'boolean', default: true,
				description: 'Whether to return the highest values first', displayOptions: { hide: { sortBy: [''] } },
			},
			{
				displayName: 'Deduplicate by Domain', name: 'dedupeByDomain', type: 'boolean', default: false,
				description: 'Whether to remove repeated root domains within the selection window',
			},
			{
				displayName: 'Count Only', name: 'countOnly', type: 'boolean', default: false,
				description: 'Return match counts by platform without exporting website rows',
			},
			{
				displayName: 'Max Rows', name: 'maxItems', type: 'number',
				typeOptions: { minValue: 1, maxValue: 100000 }, default: 1000,
				description: 'Maximum rows returned across all selected platforms', displayOptions: { hide: { countOnly: [true] } },
			},
			{
				displayName: 'Offset', name: 'offset', type: 'number', typeOptions: { minValue: 0 }, default: 0,
				description: 'Rows to skip for stable pagination across multiple runs', displayOptions: { hide: { countOnly: [true] } },
			},
			{
				displayName: 'Execution', name: 'execution', type: 'collection', placeholder: 'Add Option', default: {},
				options: [
					{
						displayName: 'Poll Interval (Seconds)', name: 'pollIntervalSeconds', type: 'number',
						typeOptions: { minValue: 2, maxValue: 60 }, default: 5,
						description: 'How often to check an asynchronous Actor run',
					},
					{
						displayName: 'Wait for Results', name: 'waitForResults', type: 'boolean', default: true,
						description: 'Turn off to return Apify run metadata immediately for very large exports',
					},
					{
						displayName: 'Maximum Wait (Seconds)', name: 'maxWaitSeconds', type: 'number',
						typeOptions: { minValue: 60, maxValue: 3600 }, default: 900,
						description: 'Maximum time this node waits before returning a clear timeout error',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const selectedPlatforms = this.getNodeParameter('platforms', itemIndex, ['all']) as string[];
				const keyword = (this.getNodeParameter('keyword', itemIndex, '') as string).trim();
				const country = splitList(this.getNodeParameter('country', itemIndex, '') as string).map((code) => code.toUpperCase());
				const phoneCode = (this.getNodeParameter('phoneCode', itemIndex, '') as string).trim();
				const columns = splitList(this.getNodeParameter('columns', itemIndex, '') as string);
				const sortBy = this.getNodeParameter('sortBy', itemIndex, '') as string;
				const countOnly = this.getNodeParameter('countOnly', itemIndex, false) as boolean;
				const extraFilters = this.getNodeParameter('extraFilters', itemIndex, {}) as {
					conditions?: Array<{ column?: string; operator?: string; value?: string }>;
				};
				const execution = this.getNodeParameter('execution', itemIndex, {}) as {
					waitForResults?: boolean; maxWaitSeconds?: number; pollIntervalSeconds?: number;
				};
				const filters = (extraFilters.conditions ?? []).map((condition) => ({
					column: (condition.column ?? '').trim(), operator: condition.operator ?? 'contains', value: condition.value ?? '',
				})).filter((condition) => condition.column.length > 0);

				const body: Record<string, unknown> = {
					platforms: selectedPlatforms.includes('all') ? ['all'] : selectedPlatforms,
					hasEmail: this.getNodeParameter('hasEmail', itemIndex, false) as boolean,
					hasPhone: this.getNodeParameter('hasPhone', itemIndex, false) as boolean,
					sortDesc: this.getNodeParameter('sortDesc', itemIndex, true) as boolean,
					dedupeByDomain: this.getNodeParameter('dedupeByDomain', itemIndex, false) as boolean,
					countOnly,
					maxItems: this.getNodeParameter('maxItems', itemIndex, 1000) as number,
					offset: this.getNodeParameter('offset', itemIndex, 0) as number,
				};
				if (keyword) body.keyword = keyword;
				if (country.length) body.country = country;
				if (phoneCode) body.phoneCode = phoneCode;
				if (columns.length) body.columns = columns;
				if (sortBy) body.sortBy = sortBy;
				if (filters.length) body.filters = filters;

				const started = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', {
					method: 'POST' as IHttpRequestMethods, url: `${API_BASE}/acts/${ACTOR_ID}/runs`, body, json: true,
				} as IRequestOptions);
				let run = started?.data ?? started;
				if (!run?.id) throw new NodeOperationError(this.getNode(), 'Apify did not return a run ID', { itemIndex });
				if (execution.waitForResults === false) {
					returnData.push({ json: run, pairedItem: { item: itemIndex } });
					continue;
				}

				const deadline = Date.now() + (execution.maxWaitSeconds ?? 900) * 1000;
				const pollMilliseconds = (execution.pollIntervalSeconds ?? 5) * 1000;
				while (!TERMINAL_STATUSES.has(run.status) && Date.now() < deadline) {
					await sleep(pollMilliseconds);
					const statusResponse = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', {
						method: 'GET' as IHttpRequestMethods, url: `${API_BASE}/actor-runs/${run.id}`, json: true,
					} as IRequestOptions);
					run = statusResponse?.data ?? statusResponse;
				}
				if (!TERMINAL_STATUSES.has(run.status)) {
					throw new NodeOperationError(this.getNode(), `Actor run ${run.id} is still running after ${execution.maxWaitSeconds ?? 900} seconds`, { itemIndex });
				}
				if (run.status !== 'SUCCEEDED') {
					throw new NodeOperationError(this.getNode(), `Actor run ${run.id} finished with status ${run.status}`, { itemIndex });
				}
				if (!run.defaultDatasetId) {
					throw new NodeOperationError(this.getNode(), 'Completed run has no dataset ID', { itemIndex });
				}
				const response = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', {
					method: 'GET' as IHttpRequestMethods,
					url: `${API_BASE}/datasets/${run.defaultDatasetId}/items`,
					qs: { clean: true, format: 'json' }, json: true,
				} as IRequestOptions);
				const results = Array.isArray(response) ? response : [response];
				for (const result of results) returnData.push({ json: result, pairedItem: { item: itemIndex } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: itemIndex } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}
		return [returnData];
	}
}
