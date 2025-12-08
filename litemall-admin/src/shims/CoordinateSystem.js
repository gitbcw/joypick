var registry = {
  cartesian2d: { type: 'cartesian2d', dimensions: ['x', 'y'] },
  polar: { type: 'polar', dimensions: ['radius', 'angle'] },
  singleAxis: { type: 'single', dimensions: ['single'] },
  geo: { type: 'geo', dimensions: ['lng', 'lat'] },
  calendar: { type: 'calendar', dimensions: ['time'] },
  parallel: { type: 'parallel', dimensions: ['parallel'] },
  view: { type: 'view', dimensions: ['x', 'y'] }
}

module.exports = {
  get: function(name) {
    return registry[name] || registry.view
  }
}

