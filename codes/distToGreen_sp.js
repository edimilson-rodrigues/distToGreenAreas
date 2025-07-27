// batch
var batch_assets = require('users/ers-mb-urb/urbverde:distToGreen/0-assets.js')

// Praças e áreas verdes
var greenAreas = batch_assets.greenAreas.map(function(f){return f.set('area_recalc', f.area())})
    greenAreas = ee.FeatureCollection(greenAreas)

// Map.addLayer(greenAreas, {color: 'green'}, 'greenAreas')

// centroids dos setores censitarios
var centroids = ee.FeatureCollection(batch_assets.centroids)

// setores censitários urbanos
var setCens = ee.FeatureCollection(batch_assets.setCens)

// FeatureCollection com setores
var ft1 = ee.Filter.eq('CD_SIT', '1')
var ft2 = ee.Filter.eq('CD_SIT', '2')
var ft3 = ee.Filter.eq('CD_SIT', '3')
var ft = ee.Filter.or(ft1, ft2, ft3)

// setores censitarios filtrados
var setCens = setCens.filter(ft)

// Map.addLayer(setCens)

//Lista de municípios
var munCodeList = [
  // são paulo
  '3550308',
  ]

// list of areas pairs
var areaCutOffList = [
  [0,1e13],
  [0,5000],
  [5000, 1e13]
  ]

areaCutOffList = ee.List(areaCutOffList)

function distanceToGreenAreas (munCode, percentList){
  
  var filter = ee.Filter.eq('CD_MUN', munCode)
  
  // centroids by mun
  var centroidsFiltered = ee.FeatureCollection(centroids.filter(filter)).randomColumn()
  
  // munFeature
  // var munFeature = setCens.filter(filter).geometry()
  var munFeature = setCens.filter(filter).union()
  
  var greenAreasByMun = greenAreas.filterBounds(munFeature)
  // Map.addLayer(greenAreasByMun, {}, 'greenAreasByMun')
  
  function distanceCalcToEachCentroid (c){
  
    // function to calc the distance based on area thresholds
    function distanceByArea (areaLimits, listDistance){
      
      // declare the lists
      listDistance = ee.List(listDistance)
      areaLimits = ee.List(areaLimits)
      
      // filter green areas based on area values
      var greenAreasFiltered = greenAreasByMun
          .filter(ee.Filter.gt('area_recalc', areaLimits.get(0)))
          .filter(ee.Filter.lte('area_recalc',areaLimits.get(1)))
      
      // calculate the distance (green areas x centroids)
      var distance = c.distance({'right': greenAreasFiltered.geometry(), 'maxError': 1})
      
      // obtains the results fomated
      distance = ee.Number(distance).format('%.3f')
      
      return listDistance.add(distance)
    }
    
    // get the result to all pairs of areas values
    var distResultList = ee.List(areaCutOffList.iterate(distanceByArea, ee.List([])))
    
    return c
    .set('distance_to_nearest_greenArea', distResultList.get(0))
    .set('distance_to_greenAreas_lt_5000m2', distResultList.get(1))
    .set('distance_to_greenAreas_gte_5000m2', distResultList.get(2))
  
  }
  
  percentList.forEach(function (p){
    
    var result = centroidsFiltered
        .filter(ee.Filter.gt('random', p[1]))
        .filter(ee.Filter.lte('random', p[2]))
        .map(distanceCalcToEachCentroid)
    
    // Map.addLayer(result, {}, munCode + '_' + p[0])
    
    var fileName = description + '_' + munCode + '_' + p[0]
  
    Export.table.toDrive({
      collection: result,
      description: fileName, 
      folder: info.driveFolder, 
      fileNamePrefix: fileName,  
      fileFormat: 'CSV', 
      selectors: selectors
    })
    
  })
  
  
  // return ee.FeatureCollection(centroidsFiltered.map(distanceCalcToEachCentroid))
}

var selectors = [
  'CD_MUN', 
  'NM_MUN', 
  'CD_SETOR', 
  'CD_SIT',
  'distance_to_nearest_greenArea', 
  'distance_to_greenAreas_lt_5000m2',
  'distance_to_greenAreas_gte_5000m2',
  ]

var info = {
  // 'version': 1,
  'version': 2, // with better filtering process
  'osm': 2025,
  // 'details': 'urban set cens from 2022; osm 2025',
  'details': 'urban set cens from 2022; osm 2025; filtering process was improved',
  // 'driveFolder': 'urbVerde_exports',
  // 'driveFolder': 'urbVerde_exports_distToGreen',
  'driveFolder': 'urbVerde_exports_distToGreen_sp',
  'assetId': 'projects/ee-ppgsea/assets/urbverde'
}

var description = 'distanceToGreen_v' + info.version

var list = []
var size = 40

for (var i = 0; i<size; i++){
  
  var sublist = []
  
  sublist.push(i, i/size, (i+1)/size)
  
  list.push(sublist)
}

distanceToGreenAreas ('3550308', list)
