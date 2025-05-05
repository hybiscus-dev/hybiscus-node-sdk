/**
 * @module Client HybiscusClient for API calls
 */

import { IReportDefinition, Report } from "./Report";
import crossFetch from "cross-fetch";
import { API, HybiscusAPIError, isHybiscusAPIError } from "./utils/api";

export type TaskStatus =
    | "CREATED"
    | "SUCCESS"
    | "FAILED"
    | "RUNNING"
    | "QUEUED"
    | null;

export interface IBuildReportRequest {
    report?: Report | null;
    reportJSON?: IReportDefinition | null;
}
export interface IBuildReportResponse {
    url: string | null;
    taskID: string | null;
    status: TaskStatus;
}

export type IPreviewReportRequest = IBuildReportRequest;
export type IPreviewReportResponse = IBuildReportResponse;

interface HybiscusClientOptions {
    apiKey: string;
    asyncBaseURL?: string;
    fetchInstance?: typeof crossFetch;
    timeout?: number;
}

class HybiscusClient {
    api: API;
    apiKey: string;
    asyncBaseURL: string;
    timeout: number = 60;

    constructor(options: HybiscusClientOptions) {
        const {
            apiKey,
            asyncBaseURL = "https://api.hybiscus.dev/api/v1",
            timeout = 60,
            fetchInstance,
        } = options;
        this.asyncBaseURL = asyncBaseURL;
        this.timeout = timeout;
        this.apiKey = apiKey;
        this.api = new API(apiKey, asyncBaseURL, timeout, fetchInstance);
    }

    /**
     * Builds the PDF report defined by the schema
     * @param config Configuration for the build report function
     * @param config.report Instance of Report class
     * @param config.reportSchema Manually generated report schema
     * @returns Promise that resolves to the PDF report URL
     */
    async buildReport({
        report = null,
        reportJSON = null,
    }: IBuildReportRequest): Promise<IBuildReportResponse> {
        const reportDefinition = report?.getDefinition() || reportJSON;
        const buildReportResponse =
            await this.api.buildReport(reportDefinition);
        const taskID = buildReportResponse.taskID;
        if (taskID === null) {
            throw {
                status: null,
                taskID: null,
                error: "No task ID returned.",
            } as HybiscusAPIError;
        }
        const taskStatusResponse = await this.api.getTaskStatus(taskID);
        if (taskStatusResponse.status === "SUCCESS") {
            return {
                taskID,
                url: `${this.asyncBaseURL}/get-report?task_id=${taskID}&api_key=${this.apiKey}`,
                status: "SUCCESS",
            };
        }
        await this.api.waitForTaskSuccess(taskID);
        return {
            taskID,
            url: `${this.asyncBaseURL}/get-report?task_id=${taskID}&api_key=${this.apiKey}`,
            status: "SUCCESS",
        };
    }

    /**
     * Allows you to generate a low quality JPEG preview of the report,
     * instead of the final PDF which counts towards your quota.
     * @param config Configuration for the preview report function
     * @param config.report Instance of Report class
     * @param config.reportSchema Manually generated report schema
     * @returns Promise that resolves to the PDF report URL
     */
    async previewReport({
        report = null,
        reportJSON = null,
    }: IPreviewReportRequest): Promise<IPreviewReportResponse> {
        const reportDefinition = report?.getDefinition() || reportJSON;
        const previewReportResponse =
            await this.api.previewReport(reportDefinition);
        const taskID = previewReportResponse.taskID;
        if (taskID === null) {
            throw {
                status: previewReportResponse.status,
                taskID: null,
                error: "No task ID returned.",
            } as HybiscusAPIError;
        }
        const taskStatusResponse = await this.api.getTaskStatus(taskID);
        if (taskStatusResponse.status === "SUCCESS") {
            return {
                taskID,
                url: `${this.asyncBaseURL}/get-report?task_id=${taskID}&api_key=${this.apiKey}`,
                status: "SUCCESS",
            };
        }
        await this.api.waitForTaskSuccess(taskID);
        return {
            taskID,
            url: `${this.asyncBaseURL}/get-report?task_id=${taskID}&api_key=${this.apiKey}`,
            status: "SUCCESS",
        };
    }
}

export { HybiscusClient, isHybiscusAPIError };
