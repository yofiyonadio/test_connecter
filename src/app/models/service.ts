import axios, { AxiosResponse, AxiosError, AxiosInstance, AxiosBasicCredentials, CancelToken } from 'axios'
import BaseModel from 'energie/build/app/models/_base'
const Canceller = axios.CancelToken

export type TypeRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

class ServiceModel extends BaseModel {

	protected static __type = 'service'

	baseUrl: string
	service: AxiosInstance

	constructor(baseURL: string, timeout: number = 10 * 1000) {
		super()

		this.baseUrl = baseURL || ''
		this.service = axios.create({
			baseURL,
			timeout,
			// headers: {'X-Custom-Header': 'foobar'}
		})

		return this
	}

	private _getHeaderAuth(token: string) {
		return token ? {
			Authorization: `Bearer ${token}`,
		} : {}
	}

	private async request(url: string, option:
		{
			method: TypeRequestMethod
			headers?: {}
			token?: string
			auth?: AxiosBasicCredentials
			query?: any
			data?: any
			onUploadProgress?: (progressEvent: any) => void
			onDownloadProgress?: (progressEvent: any) => void
			cancelToken?: CancelToken
		} = {
			method: 'GET',
			headers: {},
			token: undefined,
			auth: undefined,
			query: undefined,
			data: undefined,
			onUploadProgress: undefined,
			onDownloadProgress: undefined,
			cancelToken: undefined
		}) {
		Log()
		Log('Axios :::> ', this.baseUrl + url, option)
		Log()
		// const canceller = Canceller.source()
		return await this.service.request({
			url: this.baseUrl + url + '', // Stringify the url

			// `headers` are custom headers to be sent
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'Cache-Control': 'no-cache',
				...this._getHeaderAuth(option.token),
				...option.headers,
			},

			auth: option.auth,

			// `params` are the URL parameters to be sent with the request
			// Must be a plain object or a URLSearchParams object
			params: option.query,

			// `method` is the request method to be used when making the request
			method: option.method,

			// `data` is the data to be sent as the request body
			// Only applicable for request methods 'PUT', 'POST', and 'PATCH'
			// When no `transformRequest` is set, must be of one of the following types:
			// - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
			// - Browser only: FormData, File, Blob
			// - Node only: Stream, Buffer
			data: option.data,

			// `responseType` indicates the type of data that the server will respond with
			// options are 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
			responseType: 'json', // default

			// `validateStatus` defines whether to resolve or reject the promise for a given
			// HTTP response status code. If `validateStatus` returns `true` (or is set to `null`
			// or `undefined`), the promise will be resolved; otherwise, the promise will be
			// rejected.
			// validateStatus: function(status) {
			// 	return status >= 200 && status < 300; // default
			// },

			// `onUploadProgress` allows handling of progress events for upload
			onUploadProgress: option.onUploadProgress,
			// `onDownloadProgress` allows handling of progress events for downloads
			onDownloadProgress: option.onDownloadProgress,

			// `cancelToken` specifies a cancel token that can be used to cancel the request
			// (see Cancellation section below for details)
			cancelToken: option.cancelToken,
		}).then((res: AxiosResponse) => {
			// this.log('Getting a response', this.baseUrl + url)

			return res.data
		}).catch((err: AxiosError) => {
			// this.warn('Catching an error',  this.baseUrl + url, option)
			// this.warn(err)
			// this.warn(err.response)

			throw err.response?.data || err.response || err
		})

	}

	generateCanceller() {
		return Canceller.source()
	}

	async GET(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>) {
		return this.request(url, {
			method: 'GET',
			...options,
		})
	}

	async POST(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>) {
		return this.request(url, {
			method: 'POST',
			...options,
		})
	}

	async DELETE(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>) {
		return this.request(url, {
			method: 'DELETE',
			...options,
		})
	}

	async PUT(url: string, options: Omit<Parameters<typeof this.request>[1], 'method'>) {
		return this.request(url, {
			method: 'PUT',
			...options,
		})
	}

	async PATCH(url: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>) {
		return this.request(url, {
			method: 'PATCH',
			...options,
		})
	}

}

export default ServiceModel
