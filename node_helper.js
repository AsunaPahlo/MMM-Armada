/* MagicMirror²
 * Module: MMM-Armada
 * Node Helper - Fetches submarine data from Armada-web API
 *
 * MIT Licensed.
 */

const Log = require('logger')
const NodeHelper = require('node_helper')

module.exports = NodeHelper.create({
  start: function () {
    Log.log('Starting node_helper for: ' + this.name)
  },

  async getData(payload) {
    try {
      const url = `${payload.apiUrl}/api/v1/dashboard`

      // API key is required for v1 API
      if (!payload.apiKey) {
        throw new Error('API key is required. Set apiKey in module config.')
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payload.apiKey}`,
      }

      Log.log(`[MMM-Armada] Fetching data from: ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      this.sendSocketNotification('ARMADA_RESPONSE', {
        identifier: payload.identifier,
        data: data,
      })

      Log.log(`[MMM-Armada] Successfully fetched dashboard data`)
    }
    catch (error) {
      Log.error('[MMM-Armada] Could not load data:', error.message)
      this.sendSocketNotification('ARMADA_RESPONSE', {
        identifier: payload.identifier,
        error: `Failed to fetch: ${error.message}`,
      })
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'ARMADA_REQUEST') {
      this.getData(payload)
    }
  },
})
