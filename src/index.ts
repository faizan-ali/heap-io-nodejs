import axios from 'axios'

interface HeapEvent {
	identity?: string
	properties?: Record<string, any>
	// Unix timestamp in milliseconds
	timestamp?: number
}

interface HeapUserProperties {
	properties: Record<string, any>
}

interface TrackRequestBody {
	app_id: string
	identity?: string
	event: string
	properties?: Record<string, any>
	timestamp?: number
}

interface AddUserPropertiesRequestBody {
	app_id: string
	identity: string
	properties: Record<string, any>
}

// The Heap API does not currently return any content on success
type HeapSuccessResponse = {}

interface HeapErrorResponse {
	error: string
}

type Logger = Pick<typeof console, 'info' | 'error'>

export class Heap {
	private axiosInstance: axios.AxiosInstance
	private readonly appId: string
	private log: Logger

	constructor(appId: string, log?: Logger) {
		if (!appId) {
			throw new Error('Heap App ID is required')
		}

		this.log = log || console
		this.appId = appId
		this.axiosInstance = axios.create({
			baseURL: 'https://heapanalytics.com/api',
			timeout: 5000
		})
	}

	/**
	 * Tracks an event in Heap.
	 * @param event - The name of the event you are tracking in Heap.
	 * @param eventData - Data related to the event.
	 * @returns AxiosResponse containing the success response.
	 */
	async track(
		event: string,
		eventData: HeapEvent
	): Promise<axios.AxiosResponse<HeapSuccessResponse>> {
		const url = '/track'

		const data: TrackRequestBody = {
			app_id: this.appId,
			identity: eventData.identity,
			event,
			properties: eventData.properties,
			timestamp: eventData.timestamp
		}

		try {
			const response = await this.axiosInstance.post<HeapSuccessResponse>(
				url,
				data
			)
			return response
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as axios.AxiosError<HeapErrorResponse>

				this.log.error('Error sending event to Heap:', axiosError.message)
				if (axiosError.response) {
					this.log.error('Response data:', axiosError.response.data)
				}

				throw axiosError
			}

			this.log.error('Unexpected error in track:', error)
			throw error
		}
	}

	/**
	 * Adds properties to a user in Heap.
	 * @param identity - The identity of the user, should be a unique identifier.
	 * @param userProperties - Properties to add to the user.
	 * @returns AxiosResponse containing the success response.
	 */
	async addUserProperties(
		identity: string,
		userProperties: HeapUserProperties
	): Promise<axios.AxiosResponse<HeapSuccessResponse>> {
		const url = '/add_user_properties'

		const data: AddUserPropertiesRequestBody = {
			app_id: this.appId,
			identity,
			properties: userProperties.properties
		}

		try {
			const response = await this.axiosInstance.post<HeapSuccessResponse>(
				url,
				data
			)
			return response
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as axios.AxiosError<HeapErrorResponse>
				this.log.error(
					'Error adding user properties to Heap:',
					axiosError.message
				)

				if (axiosError.response) {
					this.log.error('Response data:', axiosError.response.data)
				}

				throw axiosError
			}

			this.log.error('Unexpected error addUserProperties:', error)
			throw error
		}
	}
}
