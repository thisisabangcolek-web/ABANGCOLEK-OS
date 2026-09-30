/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Content } from "@google/genai";
import realData from '../data.json';
import { getAccessToken } from './googleAuth';
import { 
  createGoogleFormWithQuestions, 
  listGoogleForms, 
  getGoogleForm, 
  getGoogleFormResponses 
} from './googleForms';
import { sendGmailMessage, listGmailMessages } from './googleGmail';
import { createGoogleTask, listGoogleTasks } from './googleTasks';
import { createGoogleDoc, listGoogleDocs } from './googleDocs';

// Initialize Gemini Client
// We use the 'gemini-2.5-flash-latest' model as requested for "Gemini Flash"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export interface ChatMessage extends Content {
  timestamp: Date;
  latencyMs?: number;
  groundingMetadata?: any;
  hasReport?: boolean;
  hasDashboard?: boolean;
  hasForm?: boolean;
  formData?: any;
  hasEmail?: boolean;
  emailData?: any;
  hasTask?: boolean;
  taskData?: any;
  hasDoc?: boolean;
  docData?: any;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
}

// Mock & In-Memory Database for the agent to interact with (E-Commerce & Workspace data)
export const MOCK_DB = {
  orders: realData.orders as any[],
  dashboards: [] as any[],
  reports: [] as any[],
  agents: [] as any[],
  reviews: realData.reviews as any[],
  customer_responses: [] as any[],
  forms: [] as any[],
  form_responses: [] as any[],
  emails: [] as any[],
  tasks: [] as any[],
  docs: [] as any[],
};

// Tool Definitions
export const tools = [
  {
    functionDeclarations: [
      {
        name: "analyze_sales_performance",
        description: "Fetches revenue and order volume data by date range or category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            date_range: { type: Type.STRING, description: "e.g., '2023-Q4' or 'last 30 days'" },
            group_by: { type: Type.STRING, description: "e.g., 'product_category', 'city'" },
            city: { type: Type.STRING, description: "Optional city to filter sales data by (e.g., 'sao paulo')" }
          },
          required: ["date_range"],
        },
      },
      {
        name: "investigate_shipping_delays",
        description: "Cross-references delivery dates to find bottlenecks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING, description: "e.g., 'São Paulo'" },
          },
          required: [],
        },
      },
      {
        name: "analyze_customer_sentiment",
        description: "Pulls review scores and text for specific products or generally.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_category: { type: Type.STRING, description: "Category of product, e.g. 'electronics'" },
            score_filter: { type: Type.NUMBER, description: "Review score to filter by, e.g. 1" }
          },
          required: [],
        },
      },
      {
        name: "issue_refund",
        description: "Updates the status of an order in the database and records a refund.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            order_id: { type: Type.STRING, description: "The ID of the order to refund" },
            refund_amount: { type: Type.NUMBER, description: "The amount to refund" },
            reason_code: { type: Type.STRING, description: "Reason for the refund" }
          },
          required: ["order_id", "refund_amount"],
        },
      },
      {
        name: "draft_customer_response",
        description: "Generates and saves a draft response to a specific customer review.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_id: { type: Type.STRING },
            review_id: { type: Type.STRING },
            proposed_solution: { type: Type.STRING, description: "What to offer the customer (e.g., 20% discount)" }
          },
          required: ["customer_id", "review_id", "proposed_solution"],
        },
      },
      {
        name: "start_ai_agent",
        description: "Start a sub-agent to complete a complex analysis or data gathering task autonomously.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            agent_name: { type: Type.STRING, description: "Name of the sub-agent" },
            task_description: { type: Type.STRING, description: "Detailed description of the complex task for the sub-agent to complete" },
          },
          required: ["agent_name", "task_description"],
        },
      },
      {
        name: "generate_yearly_report",
        description: "Generate a detailed text-based business report. Do NOT use this tool if the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.NUMBER },
            executive_summary: { type: Type.STRING, description: "High-level summary of the findings" },
            detailed_analysis: { type: Type.STRING, description: "In-depth plain-text analysis and business narrative. Do NOT use markdown." },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key insights" },
            metrics: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  trend: { type: Type.STRING, description: "e.g. '+15%', '-5%'" }
                }
              },
              description: "Key financial and operational metrics to visualize"
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strategic recommendations based on data" },
          },
          required: ["title", "year", "executive_summary", "detailed_analysis", "key_insights", "metrics", "recommendations"],
        },
      },
      {
        name: "create_operations_dashboard",
        description: "Create a rich data visualization dashboard. You MUST use this tool (and not the report tool) when the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  trend: { type: Type.STRING, description: "e.g., '+12%', '-5%'" }
                }
              },
              description: "Top-level summary metrics"
            },
            main_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'bar', 'line')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            secondary_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'pie', 'bar')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              },
              description: "An additional chart to show secondary insights (like category breakdowns)"
            },
            recent_activity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING }
                }
              },
              description: "List of 3-5 recent data points or quick insight bullets related to the dashboard"
            }
          },
          required: ["title", "kpis", "main_chart", "secondary_chart", "recent_activity"],
        },
      },
      {
        name: "create_google_form",
        description: "Creates a new Google Form with custom questions in Google Drive (e.g. for customer satisfaction, post-delivery feedback, return requests).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the Google Form" },
            description: { type: Type.STRING, description: "Introductory description or instructions for respondents" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Question prompt text" },
                  type: { type: Type.STRING, description: "Question type: 'choice', 'text', or 'scale'" },
                  choiceType: { type: Type.STRING, description: "Optional: 'RADIO', 'CHECKBOX', or 'DROP_DOWN' for choice questions" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for multiple-choice questions" },
                  required: { type: Type.BOOLEAN, description: "Whether this question is required" }
                },
                required: ["title", "type"]
              },
              description: "Questions to create in the Google Form"
            }
          },
          required: ["title", "questions"]
        }
      },
      {
        name: "list_google_forms",
        description: "Retrieves all Google Forms created or available in Google Drive.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: "analyze_form_responses",
        description: "Fetches and analyzes responses from a Google Form to extract satisfaction trends, feedback summary, and action items.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            form_id: { type: Type.STRING, description: "The Google Form ID to analyze" }
          },
          required: ["form_id"]
        }
      },
      {
        name: "send_gmail_email",
        description: "Sends an email to a customer, partner, or colleague using Gmail.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING, description: "Recipient email address" },
            subject: { type: Type.STRING, description: "Subject of the email" },
            body: { type: Type.STRING, description: "Body text of the email message" }
          },
          required: ["to", "subject", "body"]
        }
      },
      {
        name: "create_google_task",
        description: "Creates a new operational action item in Google Tasks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the task" },
            notes: { type: Type.STRING, description: "Optional notes or details" },
            due: { type: Type.STRING, description: "Optional ISO date or deadline" }
          },
          required: ["title"]
        }
      },
      {
        name: "create_google_doc",
        description: "Creates a formal Google Doc report or Standard Operating Procedure in Google Drive.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Document title" },
            content: { type: Type.STRING, description: "Body text or outline content of the document" }
          },
          required: ["title"]
        }
      },
      {
        name: "list_gmail_messages",
        description: "Searches and lists recent emails from Gmail inbox.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Optional search query" }
          },
          required: []
        }
      },
      {
        name: "list_google_tasks",
        description: "Lists current pending and completed tasks from Google Tasks.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        }
      }
    ],
  },
];

export interface AgentStep {
  id: string;
  type: 'text' | 'tool';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  result?: any;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  latencyMs?: number;
}

export async function sendMessageToAgentStream(
  history: ChatMessage[],
  newMessage: string,
  onUpdate: (data: { history: ChatMessage[], steps: AgentStep[], isDone: boolean, currentText: string }) => void
): Promise<void> {
  const sdkHistory = history
    .filter(h => h.role !== 'system')
    .map(h => {
      const { timestamp, latencyMs, groundingMetadata, ...content } = h;
      return content;
    });

  const contents: Content[] = [
    ...sdkHistory,
    { role: "user", parts: [{ text: newMessage }] }
  ];
  
    const config = {
    tools: tools,
    systemInstruction: `You are a top-tier E-Commerce Operations Agent for a fast-growing marketplace. 
      Your goal is to autonomously analyze sales data, handle customer service tasks, manage orders, and build reporting artifacts.
      
      Capabilities:
      1. Analysis: Analyze sales performance using 'analyze_sales_performance' and 'investigate_shipping_delays'.
      2. Customer Service: Analyze feedback using 'analyze_customer_sentiment', draft responses with 'draft_customer_response', and process refunds using 'issue_refund'.
      3. Reporting: Synthesize findings into executive summaries using 'generate_yearly_report'.
      4. Visualization: Construct data dashboards for specific metrics using 'create_operations_dashboard'.
      5. Sub-Agents: For complex multi-step market research or deep-dive tasks, use 'start_ai_agent'.

      Behavior:
        - Be proactive and comprehensive. If asked about delayed orders, use 'investigate_shipping_delays' and proactively check reviews or issue refunds if appropriate.
        - CRITICAL: Never ask for missing details to complete a tool call if you can infer them or if it's a general request. If asked to "create a dashboard for sales", use 'analyze_sales_performance' to get data, then use 'create_operations_dashboard'.
        - STRICT TOOL USAGE: If the user explicitly asks for a "report", you MUST use the 'generate_yearly_report' tool. If the user explicitly asks for a "dashboard", you MUST use the 'create_operations_dashboard' tool. Do not substitute one for the other.
        - When creating dashboards using 'create_operations_dashboard', always try to use aggregated data from tool results (like 'breakdown_by_city', 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown', or 'score_distribution') to create rich, multi-bar/multi-line charts rather than single-metric dashboards.
        - When using 'generate_yearly_report', DO NOT just use top-line totals in the 'metrics' array. You MUST include specific, granular metrics (e.g., 'December Revenue', 'Processing Orders', 'Top City Revenue', etc.) based on the tool's detailed breakdown data to make the report cards highly specific to the user's query.
        - CRITICAL RULE FOR LABELS: When creating dashboards or reports, NEVER use generic labels like "Total Revenue" or "Total Orders" if the user asked for a specific filter (like a city, timeframe, or category). You MUST dynamically change the label to reflect the exact user request and the data (e.g., "Vianopolis Revenue", "Q3 2017 Orders", "Delivered Orders", etc.). The labels must clearly communicate exactly what data is being shown.
        - Ensure reports generated via 'generate_yearly_report' are extremely comprehensive. Include detailed analysis, specific metric objects with trends, and strategic recommendations. CRITICAL: Do NOT use markdown formatting (like **bold**, *italics*, or # headers) in the 'detailed_analysis' string for reports, keep it plain text.
        - CRITICAL RULE FOR MISSING DATA: If you use a tool (like 'analyze_sales_performance') and it returns 0 orders or 0 revenue, DO NOT hallucinate, invent, or estimate data. Explicitly inform the user that there is no data available for that timeframe or category, and DO NOT generate a report or dashboard. Note that the available database only contains records from 2017 and 2018.
      - Be concise in text responses, but heavily leverage tools to showcase your advanced reasoning and versatile reporting capabilities.
      - Explain briefly what you are doing (e.g., "Analyzing Q3 sales data...", "Drafting customer response...", "Processing refund...").
      - When you call generate_yearly_report or create_operations_dashboard, do not output any conversational text afterwards.
      `,
  };

  let currentHistory = [...history];
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);
  
  let steps: AgentStep[] = [];
  let keepGoing = true;
  let maxSteps = 5;
  let stepCount = 0;
  let finalFullText = "";
  const totalStartTime = performance.now();

  const notify = (isDone: boolean = false, text: string = "") => {
    onUpdate({
      history: currentHistory,
      steps: [...steps],
      isDone,
      currentText: text
    });
  };

  try {
    let lastAggregatedParts: any[] = [];
    while (keepGoing && stepCount < maxSteps) {
      stepCount++;
      
      let responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: contents,
        config: config
      });

      let turnText = "";
      let functionCalls: any[] = [];
      let aggregatedParts: any[] = [];
      let lastChunkResponse: any = null;

      // Create a text step for this stream turn if it's the final or if it produces text
      const textStepId = Math.random().toString();
      let hasAddedTextStep = false;
      const turnStartTime = performance.now();

      for await (const chunk of responseStream) {
        lastChunkResponse = chunk;
        if (chunk.candidates?.[0]?.content?.parts) {
            aggregatedParts.push(...chunk.candidates[0].content.parts);
        }
        if (chunk.text) {
          if (!hasAddedTextStep) {
            steps.push({ id: textStepId, type: 'text', content: "", status: 'streaming' });
            hasAddedTextStep = true;
          }
          turnText += chunk.text;
          const stepIndex = steps.findIndex(s => s.id === textStepId);
          if (stepIndex > -1) {
            steps[stepIndex].content = turnText;
          }
          finalFullText += chunk.text;
          notify(false, finalFullText);
        }
        if (chunk.functionCalls) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      lastAggregatedParts = aggregatedParts;

      const turnEndTime = performance.now();

      if (hasAddedTextStep) {
        const stepIndex = steps.findIndex(s => s.id === textStepId);
        if (stepIndex > -1) {
          steps[stepIndex].status = 'completed';
          steps[stepIndex].latencyMs = turnEndTime - turnStartTime;
        }
        notify(false, finalFullText);
      }

      // Reconstruct full response candidate for history appending
      if (aggregatedParts.length > 0 && functionCalls.length > 0) {
          // If we had function calls, append them back to contents
          // The SDK requires passing back what the model outputted
          contents.push({
              role: "model",
              parts: aggregatedParts
          });

          const toolResults = [];

          for (const call of functionCalls) {
            const stepId = call.id || Math.random().toString();
            steps.push({
              id: stepId,
              type: 'tool',
              toolName: call.name,
              toolArgs: call.args,
              status: 'streaming'
            });
            notify(false, finalFullText);

            const toolStartTime = performance.now();
            let output: any = { success: true };
            
            if (call.name === "analyze_sales_performance") {
              const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
              const year = yearMatch ? yearMatch[0] : "";
              const relevantOrders = MOCK_DB.orders.filter(o => {
                const matchesYear = !year || (o.date && o.date.startsWith(year));
                const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
                return matchesYear && matchesCity;
              });
              const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
              const totalOrders = relevantOrders.length;
              
              const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
                const date = new Date(order.date);
                const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
                if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
                acc[month].revenue += order.amount || 0;
                acc[month].orders += 1;
                return acc;
              }, {});

              const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
                month,
                revenue: Math.round(stats.revenue * 100) / 100,
                orders: stats.orders
              }));

              const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
                const city = order.city || 'unknown';
                if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
                acc[city].revenue += order.amount || 0;
                acc[city].orders += 1;
                return acc;
              }, {});

              const topCities = Object.entries(cityBreakdown)
                .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 10);
                
              const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
                const status = order.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              const data = { 
                revenue: Math.round(totalRevenue * 100) / 100, 
                orders: totalOrders,
                monthly_breakdown: formattedMonthly,
                top_cities_revenue: topCities,
                order_status_breakdown: statusBreakdown
              };
              output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "investigate_shipping_delays") {
              const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
              
              const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
                acc[order.city] = (acc[order.city] || 0) + 1;
                return acc;
              }, {});

              const topDelayedCities = Object.entries(cityBreakdown)
                .map(([city, count]) => ({ city, count }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

              output = { 
                success: true, 
                message: `Found ${delayedOrders.length} delayed orders.`, 
                total_delayed: delayedOrders.length,
                breakdown_by_city: topDelayedCities,
                data: delayedOrders.slice(0, 10)
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "analyze_customer_sentiment") {
              let relevantReviews = MOCK_DB.reviews;
              if (call.args.product_category) {
                relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
              }
              if (call.args.score_filter) {
                relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
              }
              
              const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
                acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
                return acc;
              }, {});

              output = { 
                success: true, 
                message: `Fetched ${relevantReviews.length} reviews.`, 
                score_distribution: scoreDistribution,
                data: relevantReviews.slice(0, 10).map(r => {
                  const order = MOCK_DB.orders.find(o => o.order_id === r.order_id);
                  return { ...r, order_amount: order ? order.amount : undefined };
                })
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "issue_refund") {
              let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
              if (order) {
                order.status = "Refunded";
                output = { success: true, message: `Refund of $${call.args.refund_amount} issued for order ${call.args.order_id}.` };
              } else {
                output = { success: false, message: `Order ${call.args.order_id} not found.` };
              }
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "draft_customer_response") {
              MOCK_DB.customer_responses.push(call.args);
              output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "generate_yearly_report") {
              MOCK_DB.reports.push(call.args);
              output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "create_operations_dashboard") {
              MOCK_DB.dashboards.push(call.args);
              output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "start_ai_agent") {
              try {
                const startAiTask = performance.now();
                const subAgentResponse = await ai.models.generateContent({
                  model: MODEL_NAME,
                  contents: [
                    { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                  ]
                });
                const resultText = subAgentResponse.text;
                const endAiTask = performance.now();
                const latency = endAiTask - startAiTask;
                MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
                output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_form") {
              try {
                const token = await getAccessToken();
                let formRecord: any;
                if (token) {
                  formRecord = await createGoogleFormWithQuestions(
                    call.args.title,
                    call.args.description,
                    call.args.questions
                  );
                  MOCK_DB.forms.unshift(formRecord);
                  output = {
                    success: true,
                    message: `Successfully created Google Form "${call.args.title}" directly in your Google account!`,
                    formId: formRecord.formId,
                    responderUri: formRecord.responderUri || `https://docs.google.com/forms/d/${formRecord.formId}/viewform`,
                    editUri: `https://docs.google.com/forms/d/${formRecord.formId}/edit`,
                    questionsCount: call.args.questions?.length || 0,
                    data: formRecord
                  };
                } else {
                  const mockId = 'form_' + Math.random().toString(36).substring(2, 9);
                  formRecord = {
                    formId: mockId,
                    info: {
                      title: call.args.title,
                      description: call.args.description || "Created with AI Operations Agent"
                    },
                    responderUri: `https://docs.google.com/forms/d/${mockId}/viewform`,
                    items: (call.args.questions || []).map((q: any, i: number) => ({
                      itemId: 'q_' + i,
                      title: q.title,
                      questionItem: { question: { required: q.required ?? true } }
                    })),
                    isDraft: true
                  };
                  MOCK_DB.forms.unshift(formRecord);
                  output = {
                    success: true,
                    message: `Google Form drafted: "${call.args.title}". (Tip: Sign in with Google in the Forms tab to deploy directly to your live Google Drive).`,
                    formId: mockId,
                    questionsCount: call.args.questions?.length || 0,
                    data: formRecord
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_google_forms") {
              try {
                const token = await getAccessToken();
                let driveFiles: any[] = [];
                if (token) {
                  driveFiles = await listGoogleForms();
                }
                const combined = [
                  ...driveFiles.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, link: f.webViewLink })),
                  ...MOCK_DB.forms.map(f => ({ id: f.formId, name: f.info?.title || 'Untitled Form', modifiedTime: new Date().toISOString(), link: f.responderUri }))
                ];
                output = {
                  success: true,
                  message: `Found ${combined.length} Google Forms.`,
                  forms: combined
                };
              } catch (err: any) {
                output = { success: false, error: err.message, forms: MOCK_DB.forms };
              }
            } else if (call.name === "analyze_form_responses") {
              try {
                const token = await getAccessToken();
                let responses: any[] = [];
                if (token) {
                  responses = await getGoogleFormResponses(call.args.form_id);
                }
                output = {
                  success: true,
                  formId: call.args.form_id,
                  total_responses: responses.length,
                  message: `Fetched ${responses.length} responses for form ${call.args.form_id}.`,
                  responses: responses.slice(0, 15)
                };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "send_gmail_email") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const res = await sendGmailMessage(args.to, args.subject, args.body);
                  output = {
                    success: true,
                    message: `Email sent to ${args.to} via Gmail!`,
                    data: { to: args.to, subject: args.subject, body: args.body, id: res.id }
                  };
                } else {
                  MOCK_DB.emails.unshift(args);
                  output = {
                    success: true,
                    message: `Email prepared for ${args.to} in workspace. (Sign in with Google to deliver via live Gmail).`,
                    data: args
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_task") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const task = await createGoogleTask('@default', args.title, args.notes, args.due);
                  output = {
                    success: true,
                    message: `Created task "${args.title}" in Google Tasks!`,
                    data: task
                  };
                } else {
                  const task = { id: 'task_' + Date.now(), title: args.title, notes: args.notes, due: args.due, status: 'needsAction' };
                  MOCK_DB.tasks.unshift(task);
                  output = {
                    success: true,
                    message: `Task "${args.title}" added to workspace.`,
                    data: task
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_google_doc") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                if (token) {
                  const doc = await createGoogleDoc(args.title, args.content);
                  output = {
                    success: true,
                    message: `Created Google Document "${args.title}" in Google Drive!`,
                    documentId: doc.documentId,
                    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
                    data: doc
                  };
                } else {
                  const doc = { id: 'doc_' + Date.now(), name: args.title, content: args.content };
                  MOCK_DB.docs.unshift(doc);
                  output = {
                    success: true,
                    message: `Google Document drafted: "${args.title}".`,
                    data: doc
                  };
                }
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_gmail_messages") {
              try {
                const token = await getAccessToken();
                const args = (call.args || {}) as any;
                let list: any[] = [];
                if (token) {
                  list = await listGmailMessages(args.query);
                }
                output = { success: true, messages: list };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "list_google_tasks") {
              try {
                const token = await getAccessToken();
                let tasksList: any[] = [];
                if (token) {
                  tasksList = await listGoogleTasks();
                }
                output = { success: true, tasks: tasksList };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            }

            const toolEndTime = performance.now();

            const stepIndex = steps.findIndex(s => s.id === stepId);
            if (stepIndex > -1) {
              steps[stepIndex].status = 'completed';
              steps[stepIndex].result = output;
              steps[stepIndex].latencyMs = toolEndTime - toolStartTime;
            }
            notify(false, finalFullText);

            toolResults.push({
              name: call.name,
              result: output
            });
          }

          if (toolResults.length > 0) {
              const functionResponseParts = toolResults.map(tr => ({
                  functionResponse: {
                      name: tr.name,
                      response: tr.result
                  }
              }));
              
              contents.push({
                  role: "user",
                  parts: functionResponseParts
              });
          } else {
              keepGoing = false;
          }
      } else {
        keepGoing = false;
      }
    }

    const generatedReport = steps.some(s => s.type === 'tool' && s.toolName === "generate_yearly_report");
    const generatedDashboard = steps.some(s => s.type === 'tool' && s.toolName === "create_operations_dashboard");
    const generatedFormStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_form");
    const generatedEmailStep = steps.find(s => s.type === 'tool' && s.toolName === "send_gmail_email");
    const generatedTaskStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_task");
    const generatedDocStep = steps.find(s => s.type === 'tool' && s.toolName === "create_google_doc");

    const modelMsg: ChatMessage = {
      role: "model",
      parts: lastAggregatedParts.length > 0 ? lastAggregatedParts : [{ text: finalFullText || "" }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard,
      hasForm: Boolean(generatedFormStep),
      formData: generatedFormStep?.result?.data,
      hasEmail: Boolean(generatedEmailStep),
      emailData: generatedEmailStep?.result?.data,
      hasTask: Boolean(generatedTaskStep),
      taskData: generatedTaskStep?.result?.data,
      hasDoc: Boolean(generatedDocStep),
      docData: generatedDocStep?.result?.data,
    };
    currentHistory.push(modelMsg);
    
    notify(true, "");

  } catch (error: any) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: `I encountered an error while processing your request: ${error?.message || error}. Please try again.` }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    notify(true, "");
  }
}

export async function sendMessageToAgent(
  history: ChatMessage[],
  newMessage: string,
  onToolCall?: (toolCall: ToolCall) => void
): Promise<ChatMessage[]> {
  // Convert our internal history format to Gemini's format
  // We need to handle tool responses carefully in a real app, 
  // but for this demo we'll simplify by just sending the text conversation 
  // and letting the model "think" it executed tools via the current turn.
  
  // Actually, to properly demonstrate multi-step, we should use the chat session.
  // However, since we are stateless between calls in this simple function, 
  // we'll instantiate a new chat each time with history.
  
    // We need to map our history to the SDK's Content format
    const sdkHistory = history
      .filter(h => h.role !== 'system') // Filter out system messages if any
      .map(h => {
        const { timestamp, latencyMs, groundingMetadata, ...content } = h;
        return content;
      });
console.log(MODEL_NAME)
    const contents: Content[] = [
      ...sdkHistory,
      { role: "user", parts: [{ text: newMessage }] }
    ];
    
    const config = {
      tools: tools,
      systemInstruction: `You are a top-tier E-Commerce Operations Agent. 
        Your goal is to autonomously analyze sales data, handle customer service tasks, manage orders, and build reporting artifacts.
        
        Capabilities:
        1. Analysis: Analyze sales performance using 'analyze_sales_performance' and 'investigate_shipping_delays'.
        2. Customer Service: Analyze feedback using 'analyze_customer_sentiment', draft responses with 'draft_customer_response', and process refunds using 'issue_refund'.
        3. Reporting: Synthesize findings into executive summaries using 'generate_yearly_report'.
        4. Visualization: Construct data dashboards for specific metrics using 'create_operations_dashboard'.
        5. Sub-Agents: For complex multi-step market research or deep-dive tasks, use 'start_ai_agent'.
  
        Behavior:
        - Be proactive and comprehensive. If asked about delayed orders, use 'investigate_shipping_delays' and proactively check reviews or issue refunds if appropriate.
        - CRITICAL: Never ask for missing details to complete a tool call if you can infer them or if it's a general request. If asked to "create a dashboard for sales", use 'analyze_sales_performance' to get data, then use 'create_operations_dashboard'.
        - STRICT TOOL USAGE: If the user explicitly asks for a "report", you MUST use the 'generate_yearly_report' tool. If the user explicitly asks for a "dashboard", you MUST use the 'create_operations_dashboard' tool. Do not substitute one for the other.
        - When creating dashboards using 'create_operations_dashboard', always try to use aggregated data from tool results (like 'breakdown_by_city', 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown', or 'score_distribution') to create rich, multi-bar/multi-line charts rather than single-metric dashboards.
        - When using 'generate_yearly_report', DO NOT just use top-line totals in the 'metrics' array. You MUST include specific, granular metrics (e.g., 'December Revenue', 'Processing Orders', 'Top City Revenue', etc.) based on the tool's detailed breakdown data to make the report cards highly specific to the user's query.
        - CRITICAL RULE FOR LABELS: When creating dashboards or reports, NEVER use generic labels like "Total Revenue" or "Total Orders" if the user asked for a specific filter (like a city, timeframe, or category). You MUST dynamically change the label to reflect the exact user request and the data (e.g., "Vianopolis Revenue", "Q3 2017 Orders", "Delivered Orders", etc.). The labels must clearly communicate exactly what data is being shown.
        - Ensure reports generated via 'generate_yearly_report' are extremely comprehensive. Include detailed analysis, specific metric objects with trends, and strategic recommendations. CRITICAL: Do NOT use markdown formatting (like **bold**, *italics*, or # headers) in the 'detailed_analysis' string for reports, keep it plain text.
        - CRITICAL RULE FOR MISSING DATA: If you use a tool (like 'analyze_sales_performance') and it returns 0 orders or 0 revenue, DO NOT hallucinate, invent, or estimate data. Explicitly inform the user that there is no data available for that timeframe or category, and DO NOT generate a report or dashboard. Note that the available database only contains records from 2017 and 2018.
        - CRITICAL RULE FOR RESPONDING: NEVER use the words "invent", "fake", "dummy", "generate realistic data", or "made up" in your text response to the user. Always speak to the user as if the data you pulled, processed, or generated is 100% real and already existed in the database. Be confident and professional.
        - Be concise in text responses, but heavily leverage tools to showcase your advanced reasoning and versatile reporting capabilities.
        - Explain briefly what you are doing (e.g., "Analyzing Q3 sales data...", "Drafting customer response...", "Processing refund...").
        - When you call generate_yearly_report or create_operations_dashboard, do not output any conversational text afterwards.
        `,
    };

  
  let currentHistory = [...history];
  const totalStartTime = performance.now();
  
  // Add user message to history for the UI
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);

  // Send message
  try {
    // Start the turn
    let result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: config
    });

    // Loop for tool calls
    // The SDK might handle some, but often we need to check `functionCalls`
    
    let keepGoing = true;
    let maxSteps = 5;
    let step = 0;
    const allToolCallRecords: ToolCall[] = [];

    while (keepGoing && step < maxSteps) {
      step++;
      const response = result; // result IS the response
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // We have tool calls
        
        // Append the model's function calls to contents so the model has the context
        if (response.candidates && response.candidates[0].content) {
            contents.push(response.candidates[0].content);
        }

        const toolResults = [];
        const toolCallRecords: ToolCall[] = [];

        for (const call of functionCalls) {
          console.log("Tool Call:", call.name, call.args);
          
          // Notify UI
          const toolCallRecord: ToolCall = {
            id: call.id || Math.random().toString(), // SDK might not always give ID in all versions
            name: call.name,
            args: call.args as any,
          };
          toolCallRecords.push(toolCallRecord);
          allToolCallRecords.push(toolCallRecord);
          if (onToolCall) onToolCall(toolCallRecord);

          // Execute Tool
          let output: any = { success: true };
          
          if (call.name === "analyze_sales_performance") {
            const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
            const year = yearMatch ? yearMatch[0] : "";
            const relevantOrders = MOCK_DB.orders.filter(o => {
              const matchesYear = !year || (o.date && o.date.startsWith(year));
              const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
              return matchesYear && matchesCity;
            });
            const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const totalOrders = relevantOrders.length;
            
            const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
              const date = new Date(order.date);
              const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
              if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
              acc[month].revenue += order.amount || 0;
              acc[month].orders += 1;
              return acc;
            }, {});

            const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
              month,
              revenue: Math.round(stats.revenue * 100) / 100,
              orders: stats.orders
            }));

            const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
              const city = order.city || 'unknown';
              if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
              acc[city].revenue += order.amount || 0;
              acc[city].orders += 1;
              return acc;
            }, {});

            const topCities = Object.entries(cityBreakdown)
              .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 10);
              
            const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
              const status = order.status || 'unknown';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            const data = { 
              revenue: Math.round(totalRevenue * 100) / 100, 
              orders: totalOrders,
              monthly_breakdown: formattedMonthly,
              top_cities_revenue: topCities,
              order_status_breakdown: statusBreakdown
            };
            output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
          } else if (call.name === "investigate_shipping_delays") {
            const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
            
            const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
              acc[order.city] = (acc[order.city] || 0) + 1;
              return acc;
            }, {});

            const topDelayedCities = Object.entries(cityBreakdown)
              .map(([city, count]) => ({ city, count }))
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5);

            output = { 
              success: true, 
              message: `Found ${delayedOrders.length} delayed orders.`, 
              total_delayed: delayedOrders.length,
              breakdown_by_city: topDelayedCities,
              data: delayedOrders.slice(0, 10)
            };
          } else if (call.name === "analyze_customer_sentiment") {
            let relevantReviews = MOCK_DB.reviews;
            if (call.args.product_category) {
              relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
            }
            if (call.args.score_filter) {
              relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
            }
            
            const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
              acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
              return acc;
            }, {});

            output = { 
              success: true, 
              message: `Fetched ${relevantReviews.length} reviews.`, 
              score_distribution: scoreDistribution,
              data: relevantReviews.slice(0, 10) 
            };
          } else if (call.name === "issue_refund") {
            let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
            if (order) {
              order.status = "Refunded";
              output = { success: true, message: `Refund of $${call.args.refund_amount} issued for order ${call.args.order_id}.` };
            } else {
              output = { success: false, message: `Order ${call.args.order_id} not found.` };
            }
          } else if (call.name === "draft_customer_response") {
            MOCK_DB.customer_responses.push(call.args);
            output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
          } else if (call.name === "generate_yearly_report") {
            MOCK_DB.reports.push(call.args);
            output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
          } else if (call.name === "create_operations_dashboard") {
            MOCK_DB.dashboards.push(call.args);
            output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
          } else if (call.name === "create_google_form") {
            try {
              const token = await getAccessToken();
              const formArgs = (call.args || {}) as any;
              let formRecord: any;
              if (token) {
                formRecord = await createGoogleFormWithQuestions(
                  formArgs.title,
                  formArgs.description,
                  formArgs.questions
                );
                MOCK_DB.forms.unshift(formRecord);
                output = {
                  success: true,
                  message: `Successfully created Google Form "${formArgs.title}" directly in your Google account!`,
                  formId: formRecord.formId,
                  responderUri: formRecord.responderUri || `https://docs.google.com/forms/d/${formRecord.formId}/viewform`,
                  data: formRecord
                };
              } else {
                const mockId = 'form_' + Math.random().toString(36).substring(2, 9);
                formRecord = {
                  formId: mockId,
                  info: {
                    title: formArgs.title,
                    description: formArgs.description || "Created with AI Operations Agent"
                  },
                  responderUri: `https://docs.google.com/forms/d/${mockId}/viewform`,
                  items: (formArgs.questions || []).map((q: any, i: number) => ({
                    itemId: 'q_' + i,
                    title: q.title,
                    questionItem: { question: { required: q.required ?? true } }
                  })),
                  isDraft: true
                };
                MOCK_DB.forms.unshift(formRecord);
                output = {
                  success: true,
                  message: `Google Form drafted: "${formArgs.title}".`,
                  formId: mockId,
                  data: formRecord
                };
              }
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "list_google_forms") {
            try {
              const token = await getAccessToken();
              let driveFiles: any[] = [];
              if (token) {
                driveFiles = await listGoogleForms();
              }
              const combined = [
                ...driveFiles.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, link: f.webViewLink })),
                ...MOCK_DB.forms.map(f => ({ id: f.formId, name: f.info?.title || 'Untitled Form', modifiedTime: new Date().toISOString(), link: f.responderUri }))
              ];
              output = { success: true, forms: combined };
            } catch (err: any) {
              output = { success: false, error: err.message, forms: MOCK_DB.forms };
            }
          } else if (call.name === "analyze_form_responses") {
            try {
              const token = await getAccessToken();
              const formArgs = (call.args || {}) as any;
              let responses: any[] = [];
              if (token) {
                responses = await getGoogleFormResponses(formArgs.form_id);
              }
              output = {
                success: true,
                formId: formArgs.form_id,
                total_responses: responses.length,
                responses: responses.slice(0, 15)
              };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          } else if (call.name === "start_ai_agent") {
            try {
              // Create an autonomous sub-agent call
              const startAiTask = performance.now();
              const subAgentResponse = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [
                  { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                ]
              });
              const resultText = subAgentResponse.text;
              const latency = performance.now() - startAiTask;
              MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
              output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          }

          
          toolResults.push({
            id: call.id, // Must match the call ID
            name: call.name,
            result: output
          });
        }

        // Send results back to model
        // If we have function calls, we MUST send the response back
        if (toolResults.length > 0) {
            // Construct the tool response parts
            const functionResponseParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.name,
                    response: tr.result
                }
            }));
            
            contents.push({
                role: "user",
                parts: functionResponseParts
            });
            
            result = await ai.models.generateContent({
              model: MODEL_NAME,
              contents: contents,
              config: config
            });
        } else {
            keepGoing = false;
        }

      } else {
        // No function calls, just text
        keepGoing = false;
      }
    }

    // Check if report or dashboard was generated during this turn
    const generatedReport = allToolCallRecords.some(t => t.name === "generate_yearly_report");
    const generatedDashboard = allToolCallRecords.some(t => t.name === "create_operations_dashboard");

    // Final response from model
    const modelMsg: ChatMessage = {
      role: "model",
      parts: [{ text: result.text || "" }],
      timestamp: new Date(),
      groundingMetadata: result.candidates?.[0]?.groundingMetadata,
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard
    };
    currentHistory.push(modelMsg);
    
    return currentHistory;

  } catch (error) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: "I encountered an error while processing your request. Please try again." }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    return currentHistory;
  }
}
