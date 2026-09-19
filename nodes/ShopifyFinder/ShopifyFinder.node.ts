import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const ACTOR_ID = 'apivault_labs~website-leads-database';

export class ShopifyFinder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Shopify & WooCommerce Leads Database',
		name: 'shopifyFinder',
		icon: 'file:shopifyfinder.svg',
		group: ['transform'],
		version: 1,
		description: 'Find Shopify, WooCommerce and other website leads at scale. Export contacts, company data, technology stack and optional traffic estimates including monthly visits, growth and acquisition channels. Match traffic is available for domains covered by the 40M+ traffic dataset.',
		defaults: { name: 'Shopify & WooCommerce Leads Database' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'apifyApi', required: true }],
		properties: [
   {
      "displayName": "Workflow",
      "name": "workflow",
      "description": "Auto uses countOnly as before; Export returns lead rows; Count previews the audience without paid Dataset rows.",
      "type": "options",
      "options": [
         {
            "name": "Auto — preserve legacy controls",
            "value": "auto"
         },
         {
            "name": "Export matching leads",
            "value": "export"
         },
         {
            "name": "Count matches only (no Dataset rows)",
            "value": "count"
         }
      ],
      "default": "auto"
   },
   {
      "displayName": "Platforms",
      "name": "platforms",
      "description": "Which platform tables to pull sites from. Leave empty to search ALL platforms. (comma or new-line separated)",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Output preset",
      "name": "outputPreset",
      "description": "Compact is best for general AI use; Contacts and Sales produce focused lead lists; Traffic adds traffic enrichment; Full returns all 59 core columns; Custom uses Output columns.",
      "type": "options",
      "options": [
         {
            "name": "Compact — essential lead fields",
            "value": "compact"
         },
         {
            "name": "Contacts — emails, phones and socials",
            "value": "contacts"
         },
         {
            "name": "Sales — qualification and technology",
            "value": "sales"
         },
         {
            "name": "Traffic — compact plus traffic estimates",
            "value": "traffic"
         },
         {
            "name": "Full — all 59 core fields",
            "value": "full"
         },
         {
            "name": "Custom — use Output columns below",
            "value": "custom"
         }
      ],
      "default": "custom"
   },
   {
      "displayName": "Output columns",
      "name": "columns",
      "description": "Which fields to return. IMPORTANT: dataset tabs only display fields saved by this run; selecting only Emails makes Traffic, Firmographics and Tech Stack tabs empty. Leave this field empty to populate ALL tabs with all 59 columns. Root Domain and _platform are always added. (comma or new-line separated)",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Sort by",
      "name": "sortBy",
      "description": "Order rows by this column before applying the limit, so you get the top leads instead of an arbitrary slice. Empty — no ordering.",
      "type": "options",
      "options": [
         {
            "name": "Overall Score",
            "value": "Overall Score"
         },
         {
            "name": "Tranco",
            "value": "Tranco"
         },
         {
            "name": "Page Rank",
            "value": "Page Rank"
         },
         {
            "name": "Sales Revenue",
            "value": "Sales Revenue"
         },
         {
            "name": "Employees",
            "value": "Employees"
         },
         {
            "name": "Technology Spend",
            "value": "Technology Spend"
         },
         {
            "name": "SKU",
            "value": "SKU"
         },
         {
            "name": "Performance",
            "value": "Performance"
         },
         {
            "name": "SEO",
            "value": "SEO"
         },
         {
            "name": "Last Found",
            "value": "Last Found"
         }
      ],
      "default": "Overall Score"
   },
   {
      "displayName": "Countries (ISO-2)",
      "name": "country",
      "description": "One or more ISO-2 country codes, e.g. DE, IT, US. Type each code and press Enter. Empty — no country filter. (comma or new-line separated)",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Keyword",
      "name": "keyword",
      "description": "Substring in domain or company name. Empty — no filter.",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Phone country code",
      "name": "phoneCode",
      "description": "E.g. +1 or +44. Keeps sites where AT LEAST ONE phone starts with this code. Empty — no filter.",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Extra filters (any columns)",
      "name": "filters",
      "description": "Array of conditions on ANY of the 59 columns. Each item: {\"column\": \"City\", \"operator\": \"contains\", \"value\": \"Milano\"}. Operators: equals, not_equals, contains, not_contains, starts_with, ends_with, in_list (comma-separated), not_empty, empty. Conditions are combined with AND.",
      "type": "json",
      "default": "[]"
   },
   {
      "displayName": "Only with email",
      "name": "hasEmail",
      "description": "Keep only sites where the Emails column is not empty.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Add website traffic data",
      "name": "includeTrafficData",
      "description": "Optional and slower. Match exported domains against the traffic database and add visits, rank, growth, engagement and channel shares. Traffic filters below automatically enable this option.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Only sites with traffic data",
      "name": "onlyWithTrafficData",
      "description": "Return and charge only websites that have a traffic estimate. Automatically enables traffic enrichment.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Minimum monthly visits",
      "name": "minMonthlyVisits",
      "description": "Optional lower traffic threshold. Sites without traffic data or below this estimate are excluded before Dataset billing.",
      "type": "number",
      "default": 0,
      "typeOptions": {
         "minValue": 0
      }
   },
   {
      "displayName": "Maximum monthly visits",
      "name": "maxMonthlyVisits",
      "description": "Optional upper traffic threshold. Sites without traffic data or above this estimate are excluded before Dataset billing.",
      "type": "number",
      "default": 0,
      "typeOptions": {
         "minValue": 0
      }
   },
   {
      "displayName": "Sort by monthly visits",
      "name": "trafficSortOrder",
      "description": "Order traffic-matched rows inside each export selection. Traffic fields are added automatically when sorting is enabled.",
      "type": "options",
      "options": [
         {
            "name": "Do not sort by traffic",
            "value": "none"
         },
         {
            "name": "Highest traffic first",
            "value": "highest"
         },
         {
            "name": "Lowest traffic first",
            "value": "lowest"
         }
      ],
      "default": "none"
   },
   {
      "displayName": "Only with phone",
      "name": "hasPhone",
      "description": "Keep only sites where the Telephones column is not empty.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Sort descending",
      "name": "sortDesc",
      "description": "Highest values first (recommended for scores/traffic/revenue).",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Deduplicate by domain",
      "name": "dedupeByDomain",
      "description": "Do not output repeated Root Domain values when several platform datasets overlap. Single-platform datasets are already unique.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Count only",
      "name": "countOnly",
      "description": "Preview matching segment rows without per-result charges. Saves structured COUNT_SUMMARY and SUMMARY records; Actor start and platform usage may still apply. Counts can include cross-platform overlap.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Max rows",
      "name": "maxItems",
      "description": "Upper limit on returned rows per run (across all platforms combined). Max 250000. There is no total cap — use Offset to page through unlimited results across runs.",
      "type": "number",
      "default": 50,
      "typeOptions": {
         "minValue": 1,
         "maxValue": 250000
      }
   },
   {
      "displayName": "Offset (skip first N)",
      "name": "offset",
      "description": "Skip the first N source rows, then return the next batch. After a capped run, copy the exact nextOffset or resumeInput from EXPORT_CONTINUATION in the run's Key-Value Store. Set a Sort by column for stable pagination.",
      "type": "number",
      "default": 0,
      "typeOptions": {
         "minValue": 0
      }
   }
],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const body: Record<string, unknown> = {};
				body["workflow"] = this.getNodeParameter("workflow", i);
				{ const _v = this.getNodeParameter("platforms", i, '') as string; const _a = _v.split(/[,\n]/).map(s=>s.trim()).filter(s=>s.length>0); if (_a.length) body["platforms"] = _a; }
				body["outputPreset"] = this.getNodeParameter("outputPreset", i);
				{ const _v = this.getNodeParameter("columns", i, '') as string; const _a = _v.split(/[,\n]/).map(s=>s.trim()).filter(s=>s.length>0); if (_a.length) body["columns"] = _a; }
				body["sortBy"] = this.getNodeParameter("sortBy", i);
				{ const _v = this.getNodeParameter("country", i, '') as string; const _a = _v.split(/[,\n]/).map(s=>s.trim()).filter(s=>s.length>0); if (_a.length) body["country"] = _a; }
				body["keyword"] = this.getNodeParameter("keyword", i);
				body["phoneCode"] = this.getNodeParameter("phoneCode", i);
				{ const _r = this.getNodeParameter("filters", i, '') as string|object; if (_r) { try { body["filters"] = typeof _r === 'string' ? JSON.parse(_r) : _r; } catch { throw new NodeOperationError(this.getNode(), "filters" + ' must be valid JSON', { itemIndex: i }); } } }
				body["hasEmail"] = this.getNodeParameter("hasEmail", i);
				body["includeTrafficData"] = this.getNodeParameter("includeTrafficData", i);
				body["onlyWithTrafficData"] = this.getNodeParameter("onlyWithTrafficData", i);
				body["minMonthlyVisits"] = this.getNodeParameter("minMonthlyVisits", i);
				body["maxMonthlyVisits"] = this.getNodeParameter("maxMonthlyVisits", i);
				body["trafficSortOrder"] = this.getNodeParameter("trafficSortOrder", i);
				body["hasPhone"] = this.getNodeParameter("hasPhone", i);
				body["sortDesc"] = this.getNodeParameter("sortDesc", i);
				body["dedupeByDomain"] = this.getNodeParameter("dedupeByDomain", i);
				body["countOnly"] = this.getNodeParameter("countOnly", i);
				body["maxItems"] = this.getNodeParameter("maxItems", i);
				body["offset"] = this.getNodeParameter("offset", i);
				const options: IRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`,
					body,
					json: true,
				};
				const started = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', options);
				const runId = started?.data?.id;
				if (!runId) throw new NodeOperationError(this.getNode(), 'Apify did not return a run ID', { itemIndex: i });
				let run = started.data;
				const deadline = Date.now() + 60 * 60 * 1000;
				while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
					if (Date.now() >= deadline) throw new NodeOperationError(this.getNode(), 'Waiting timed out; check the existing run in Apify before retrying', { itemIndex: i });
					const polled = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', { method: 'GET', url: `https://api.apify.com/v2/actor-runs/${runId}?waitForFinish=20`, json: true });
					run = polled.data;
				}
				if (run.status !== 'SUCCEEDED') throw new NodeOperationError(this.getNode(), 'Apify run ended with status ' + run.status, { itemIndex: i });
				let offset = 0;
				while (true) {
					const page = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', { method: 'GET', url: `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?clean=1&limit=1000&offset=${offset}`, json: true });
					if (!Array.isArray(page)) throw new NodeOperationError(this.getNode(), 'Unexpected Dataset response', { itemIndex: i });
					for (const result of page) returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
					offset += page.length;
					if (page.length < 1000) break;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [returnData];
	}
}
