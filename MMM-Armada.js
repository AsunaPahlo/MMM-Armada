/* MagicMirror²
 * Module: MMM-Armada
 * Display FFXIV submarine fleet status from Armada-web
 *
 * MIT Licensed.
 */

Module.register('MMM-Armada', {

  // Default module config
  defaults: {
    debug: false,
    apiUrl: 'http://localhost:5000',
    apiKey: '',
    updateInterval: 60 * 1000,
    animationSpeed: 2 * 1000,
    initialLoadDelay: 0,
    displayMode: 'summary', // 'summary' or 'detailed'
    // Summary mode options
    summarySize: 'normal', // 'compact', 'normal', or 'large'
    summaryLayout: 'vertical', // 'vertical' or 'horizontal'
    // Detailed mode options
    maxSubmarines: 10,
    sortBy: 'hours_remaining', // 'hours_remaining', 'status', 'fc_name', 'name'
    sortAscending: true,
    showFcName: true,
    showBuild: false,
    showRoute: true,
    showLevel: true,
  },

  // Define required styles
  getStyles: function () {
    return ['MMM-Armada.css']
  },

  debugmsg: function () {
    if (this.config.debug) {
      var args = [].slice.call(arguments)
      Log.info.apply(console, args)
    }
  },

  // Define start sequence
  start: function () {
    Log.log(`Starting module: ${this.name}`)

    this.loaded = false
    this.dashboardData = null
    this.errorMessage = null
    this.scheduleUpdate(this.config.initialLoadDelay)
  },

  // Override dom generator
  getDom: function () {
    var self = this
    var wrapper = document.createElement('div')
    wrapper.className = 'mmm-armada'

    // Error message
    if (this.errorMessage) {
      wrapper.innerHTML = `<span class="error">${this.errorMessage}</span>`
      wrapper.className = 'dimmed light xsmall'
      return wrapper
    }

    // Loading message
    if (!this.loaded) {
      wrapper.innerHTML = 'Loading Armada...'
      wrapper.className = 'dimmed light small'
      return wrapper
    }

    if (!this.dashboardData) {
      wrapper.innerHTML = 'No data available'
      wrapper.className = 'dimmed light small'
      return wrapper
    }

    var data = this.dashboardData

    if (this.config.displayMode === 'summary') {
      var summaryDiv = this.createSummaryCards(data)
      wrapper.appendChild(summaryDiv)
    } else {
      // Detailed mode
      if (data.summary) {
        var summaryDiv = this.createDetailedSummary(data.summary)
        wrapper.appendChild(summaryDiv)
      }

      if (data.supply_forecast) {
        var supplyDiv = this.createSupplySection(data.supply_forecast)
        wrapper.appendChild(supplyDiv)
      }

      if (data.submarines) {
        var subsDiv = this.createSubmarinesSection(data.submarines)
        wrapper.appendChild(subsDiv)
      }
    }

    return wrapper
  },

  // Summary cards view
  createSummaryCards: function (data) {
    var div = document.createElement('div')
    div.className = 'armada-cards size-' + this.config.summarySize + ' layout-' + this.config.summaryLayout

    // Count submarines by status
    var readyCount = 0
    var almostReadyCount = 0
    var voyagingCount = 0

    if (data.submarines) {
      data.submarines.forEach(function (sub) {
        if (sub.status === 'ready') readyCount++
        else if (sub.status === 'returning_soon') almostReadyCount++
        else if (sub.status === 'voyaging') voyagingCount++
      })
    }

    // Days until restock
    var daysUntilRestock = null
    var restockClass = 'stat-ok'
    if (data.supply_forecast && data.supply_forecast.days_until_restock !== null) {
      daysUntilRestock = data.supply_forecast.days_until_restock
      if (daysUntilRestock <= 3) {
        restockClass = 'stat-critical'
      } else if (daysUntilRestock <= 7) {
        restockClass = 'stat-warning'
      }
    }

    // Gil made last 30 days (estimate from daily rate)
    var gilLast30Days = 0
    if (data.summary && data.summary.total_gil_per_day) {
      gilLast30Days = data.summary.total_gil_per_day * 30
    }

    div.innerHTML = `
      <div class="stat-card ${restockClass}">
        <div class="stat-label">Days to Restock</div>
        <div class="stat-value">${daysUntilRestock !== null ? daysUntilRestock.toFixed(0) : '—'}</div>
      </div>
      <div class="stat-card stat-voyaging">
        <div class="stat-label">Voyaging</div>
        <div class="stat-value">${voyagingCount}</div>
      </div>
      <div class="stat-card stat-ready">
        <div class="stat-label">Ready</div>
        <div class="stat-value">${readyCount}</div>
      </div>
      <div class="stat-card stat-soon">
        <div class="stat-label">Almost Ready</div>
        <div class="stat-value">${almostReadyCount}</div>
      </div>
      <div class="stat-card stat-gil">
        <div class="stat-label">Gil (30 days)</div>
        <div class="stat-value">${this.formatNumber(gilLast30Days)}</div>
      </div>
    `

    return div
  },

  // Detailed view - Summary section
  createDetailedSummary: function (summary) {
    var div = document.createElement('div')
    div.className = 'armada-summary'

    var readyClass = summary.ready_subs > 0 ? 'status-ready' : 'status-dim'

    div.innerHTML = `
      <div class="summary-row">
        <span class="summary-label">Fleet Status</span>
        <span class="summary-value">
          <span class="${readyClass}">${summary.ready_subs} ready</span>
          <span class="summary-separator">/</span>
          <span class="status-voyaging">${summary.voyaging_subs} voyaging</span>
          <span class="summary-separator">/</span>
          <span class="status-dim">${summary.total_subs} total</span>
        </span>
      </div>
    `

    if (summary.total_gil_per_day) {
      var gilRow = document.createElement('div')
      gilRow.className = 'summary-row'
      gilRow.innerHTML = `
        <span class="summary-label">Gil/Day</span>
        <span class="summary-value">${this.formatNumber(summary.total_gil_per_day)}</span>
      `
      div.appendChild(gilRow)
    }

    return div
  },

  // Detailed view - Supply section
  createSupplySection: function (supply) {
    var div = document.createElement('div')
    div.className = 'armada-supply'

    var daysClass = 'status-ok'
    if (supply.days_until_restock !== null) {
      if (supply.days_until_restock <= 3) {
        daysClass = 'status-critical'
      } else if (supply.days_until_restock <= 7) {
        daysClass = 'status-warning'
      }
    }

    var daysText = supply.days_until_restock !== null
      ? `${supply.days_until_restock.toFixed(1)} days`
      : 'OK'

    div.innerHTML = `
      <div class="supply-row">
        <span class="supply-label">Supplies</span>
        <span class="supply-value ${daysClass}">${daysText}</span>
        ${supply.limiting_resource && supply.limiting_resource !== 'none'
          ? `<span class="supply-limiting">(${supply.limiting_resource})</span>`
          : ''}
      </div>
    `

    return div
  },

  // Detailed view - Submarines table
  createSubmarinesSection: function (submarines) {
    var self = this
    var div = document.createElement('div')
    div.className = 'armada-submarines'

    // Sort submarines
    var sorted = submarines.slice().sort(function (a, b) {
      var valA, valB
      switch (self.config.sortBy) {
        case 'status':
          var statusOrder = { ready: 0, returning_soon: 1, voyaging: 2 }
          valA = statusOrder[a.status] || 3
          valB = statusOrder[b.status] || 3
          break
        case 'fc_name':
          valA = a.fc_name || ''
          valB = b.fc_name || ''
          break
        case 'name':
          valA = a.name || ''
          valB = b.name || ''
          break
        case 'hours_remaining':
        default:
          valA = a.hours_remaining
          valB = b.hours_remaining
          break
      }
      if (valA < valB) return self.config.sortAscending ? -1 : 1
      if (valA > valB) return self.config.sortAscending ? 1 : -1
      return 0
    })

    // Limit submarines shown
    var limited = sorted.slice(0, this.config.maxSubmarines)

    // Create table
    var table = document.createElement('table')
    table.className = 'small armada-table'

    limited.forEach(function (sub) {
      var row = self.createSubmarineRow(sub)
      table.appendChild(row)
    })

    // Show remaining count if limited
    if (sorted.length > this.config.maxSubmarines) {
      var moreRow = document.createElement('tr')
      moreRow.className = 'more-row'
      var moreCell = document.createElement('td')
      moreCell.colSpan = 4
      moreCell.className = 'dimmed xsmall'
      moreCell.innerHTML = `... and ${sorted.length - this.config.maxSubmarines} more`
      moreRow.appendChild(moreCell)
      table.appendChild(moreRow)
    }

    div.appendChild(table)
    return div
  },

  createSubmarineRow: function (sub) {
    var tr = document.createElement('tr')
    tr.className = `sub-row status-row-${sub.status}`

    // Status indicator
    var statusTd = document.createElement('td')
    statusTd.className = `sub-status status-${sub.status}`
    statusTd.innerHTML = this.getStatusIcon(sub.status)
    tr.appendChild(statusTd)

    // Name (and optionally FC name)
    var nameTd = document.createElement('td')
    nameTd.className = 'sub-name align-left'
    var nameText = sub.name
    if (this.config.showFcName && sub.fc_name) {
      nameText = `<span class="fc-name">${sub.fc_name}</span> ${sub.name}`
    }
    if (this.config.showLevel) {
      nameText += ` <span class="sub-level">Lv${sub.level}</span>`
    }
    nameTd.innerHTML = nameText
    tr.appendChild(nameTd)

    // Route/Build info
    var infoTd = document.createElement('td')
    infoTd.className = 'sub-info align-left dimmed'
    var infoText = ''
    if (this.config.showRoute && sub.route) {
      infoText += sub.route
    }
    if (this.config.showBuild && sub.build) {
      infoText += infoText ? ` (${sub.build})` : sub.build
    }
    infoTd.innerHTML = infoText
    tr.appendChild(infoTd)

    // Time remaining
    var timeTd = document.createElement('td')
    timeTd.className = `sub-time align-right status-${sub.status}`
    timeTd.innerHTML = this.formatTimeRemaining(sub.hours_remaining, sub.status)
    tr.appendChild(timeTd)

    return tr
  },

  getStatusIcon: function (status) {
    switch (status) {
      case 'ready':
        return '<span class="status-icon ready-icon">&#x2714;</span>' // checkmark
      case 'returning_soon':
        return '<span class="status-icon soon-icon">&#x25B2;</span>' // triangle
      case 'voyaging':
        return '<span class="status-icon voyage-icon">&#x2192;</span>' // arrow
      default:
        return '<span class="status-icon">?</span>'
    }
  },

  formatTimeRemaining: function (hours, status) {
    if (status === 'ready' || hours <= 0) {
      return '<span class="time-ready">Ready!</span>'
    }

    if (hours < 1) {
      var minutes = Math.round(hours * 60)
      return `<span class="time-soon">${minutes}m</span>`
    }

    var h = Math.floor(hours)
    var m = Math.round((hours - h) * 60)
    return `<span class="time-voyage">${h}h ${m}m</span>`
  },

  formatNumber: function (num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  },

  getData: function () {
    var self = this
    this.debugmsg('MMM-Armada: getData')

    this.sendSocketNotification('ARMADA_REQUEST', {
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
      identifier: this.identifier,
    })

    self.scheduleUpdate(self.config.updateInterval)
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'ARMADA_RESPONSE' && payload.identifier === this.identifier) {
      this.debugmsg('MMM-Armada: received response')
      if (payload.error) {
        this.errorMessage = payload.error
        this.loaded = true
      } else if (payload.data) {
        this.dashboardData = payload.data
        this.errorMessage = null
        this.loaded = true
      }
      this.updateDom(this.config.animationSpeed)
    }
  },

  scheduleUpdate: function (delay) {
    var nextLoad = this.config.updateInterval
    if (typeof delay !== 'undefined' && delay >= 0) {
      nextLoad = delay
    }

    var self = this
    setTimeout(function () {
      self.getData()
    }, nextLoad)
  },
})
