// var batch_assets = require('users/ers-mb-urb/urbverde:distToGreen/0-assets.js')

// Setores censitários
var assetUrbanSetCens = 'projects/ee-ppgsea/assets/auxiliar/urbanSetCens_2022_sp'
var setCens = ee.FeatureCollection(assetUrbanSetCens)
exports.setCens = setCens

// centroids de setores censitarios
// var assetCentroids = 'users/ee-ers/urbVerde/centroids_setCens'
var assetCentroids = 'projects/ee-ppgsea/assets/auxiliar/urbanSetCens_2022_sp_centroids'
var centroids = ee.FeatureCollection(assetCentroids)
exports.centroids = centroids

// pracas e parques
var assetGreenAreas = 'projects/ee-ppgsea/assets/auxiliar/osm_greenAreas_2025'
var greenAreas = ee.FeatureCollection(assetGreenAreas)
exports.greenAreas = greenAreas

// distancia calculada 
var assetDist = 'users/ee-ers/urbVerde/distance-to-green-areas'
var distanceCalculated = ee.FeatureCollection(assetDist)
exports.distanceCalculated = distanceCalculated
// Map.addLayer(distanceCalculated)

//Ajuste de dados com geometrias
var selectors = [
  // 'CD_SETOR',
  'DistToNearestGreenArea',
  'DistToGreenLt5000m2',
  'DistToGreenGte5000m2'
  ]

function munFilterGeometry (munName){
  
  //Filtra as estatísticas calculadas
  var calcFiltered = distanceCalculated.filter(ee.Filter.eq('NM_MUN', munName))
  
  //Converte os dados de string para float com duas casas decimais
  var recalc = calcFiltered.map(function(feature){
    
    var dist1 = ee.Number.parse(feature.get('dist_1000m2'))
    var dist2 = ee.Number.parse(feature.get('dist_2000m2'))
    var dist3 = ee.Number.parse(feature.get('dist_3000m2'))
    
    // var dist1 = ee.Number.parse(feature.get('distance_to_nearest_greenArea'))
    // var dist2 = ee.Number.parse(feature.get('distance_to_greenAreas_lt_5000m2'))
    // var dist3 = ee.Number.parse(feature.get('distance_to_greenAreas_gte_5000m2'))
    
    var setorId = feature.get('CD_SETOR')
    
    return ee.Feature(feature.geometry())
          .set('CD_SETOR', setorId)
          .set('DistToNearestGreenArea', dist1)
          .set('DistToGreenLt5000m2', dist2)
          .set('DistToGreenGte5000m2', dist3)
  })
  
  return recalc
  // .select(selectors)
}

// print(munFilterGeometry ('Caieiras'))

//Função para calcular as estatísticas por município e salvar os resultados em uma lista
var propertyList = ee.List(selectors)

function meanStatistcs (munName){
    
  //Ajusta os dados por município
  var recalc = munFilterGeometry(munName)
  
  //Função para calcular as estatísticas de um município
  var statsGet = function(property, list){
    
    //Declara a lista
    list = ee.List(list)
    
    //Declara a propriedade
    property = ee.String(property)
    
    //Calcula as estatísticas
    var statsCalc = recalc.reduceColumns({
          reducer: ee.Reducer.mean(), 
          selectors: [property],
        })
    
    var result = ee.Number(statsCalc.get('mean'))
    
    //Arredonda para duas casas decimais
    var rounded = result.multiply(100).round().divide(100)
    
    return list.add(rounded)
  }
  
  var finalResult = propertyList.iterate(statsGet, ee.List([]))

  return ee.List(finalResult)
}
exports.meanStatistcs = meanStatistcs

// print(meanStatistcs ('Caieiras'))

//Função para plotar um gráfico 
//Declara o eixo x
var xLabels = ee.List([
  'Nearest green',
  '< 5000m²',
  '≥ 5000m²',
  ])

function charting (yResults, titleProp){    
    
  //Declara o eixo y
  yResults = ee.List(yResults)
  
  // Define the chart and print it to the console.
  var chart = ui.Chart.array.values({
      array: yResults, 
      axis: 0, 
      xLabels: xLabels
    })
    .setChartType('ColumnChart')
    .setOptions({
      title: 'Distâncias a parques e praças - ' + titleProp,
      // colors: ['#31a354', '#e0f3db'],
      series:{
        0: {
          title: 'Distância média (m)',
          targetAxisIndex: 0, 
          type: 'bar', 
          color: '#a8ddb5'
        },
      },
      hAxis: {
        title: 'Critérios de área (m²)',
        titleTextStyle: {italic: false, bold: true},
        ticks: xLabels,
        textStyle: {orientation: 'vertical'}
      },
      vAxes: {
        0:{
          title: 'Distância média (m)',
          baseline: 0,
          titleTextStyle: {italic: false, bold: true}
        },
      },
      bar: {groupWidth: '40%'},
      pointSize: 4,
      dataOpacity: 0.7,
      legend: { position: 'none' }
    })
    
  return chart
}
exports.charting = charting

// print(
// charting (
//   meanStatistcs ('Caieiras'), 
//   'Caieiras')
// )

//Pintura de poligonos a partir dos dados de distância
function distanceMap (munName, property){
  
  var setCensFiltered = munFilterGeometry (munName)
  
  var colorized = setCensFiltered.map(function(feat){
    
    var setorId = feat.get('CD_SETOR')
    
    var distance = ee.Number(feat.get(property))//.multiply(1000)
    
    var setor = setCens.filter(ee.Filter.eq('CD_SETOR', setorId))
    
    var img = ee.Image().byte().paint({
      featureCollection: setor,
      color: distance
    }).toFloat()
    
    return img
  })
  
  return ee.ImageCollection(colorized).max()
}
exports.distanceMap = distanceMap

//Legend function
function legend(min, max, palette, legendNumbers) {
  var range = max - min;
  var step = range / (legendNumbers - 1);

  var legendPanel = ui.Panel({
    style: {
      width: '180px',
      position: 'bottom-right'
    }
  });

  var legendTitle = ui.Label({
    value: 'Distância (m)',
    style: {
      fontWeight: 'bold',
      margin: '0 0 4px 8px'
    }
  });
  legendPanel.add(legendTitle);

  var colorBarAndLabels = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: { margin: '0 8px' }
  });

  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select('latitude').int(),
    params: {
      bbox: [0, min, 1, max],
      dimensions: '25x150', // slimmer bar
      min: min,
      max: max,
      palette: palette,
    },
    style: {
      height: '150px',
      width: '25px',
      margin: '0 4px 0 0'
    },
  });

  // Create vertical space for labels (aligned with color bar height)
  var labelsPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      height: '150px',
      width: '40px',
      stretch: 'vertical',
      // justifyContent: 'space-between' // Important to evenly distribute labels
    }
  });

  // Generate and add equally spaced labels
  for (var i = 0; i < legendNumbers; i++) {
    var value = max - i * step;
    var label = ui.Label(value.toFixed(0), {
      fontSize: '10px',
      margin: '0',
      height: (150 / legendNumbers) + 'px' // evenly distribute
    });
    labelsPanel.add(label);
  }

  colorBarAndLabels.add(colorBar);
  colorBarAndLabels.add(labelsPanel);
  legendPanel.add(colorBarAndLabels);

  return legendPanel;
}
exports.legend = legend
// print(legend(0, 800, palette, 5));

// list of areas pairs
var areaCutOffList = [
  [0,1e13],
  [0,5000],
  [5000, 1e13]
  ]

areaCutOffList = ee.List(areaCutOffList)

function distanceToGreenAreas (munCode){
  
  var filter = ee.Filter.eq('CD_MUN', munCode)
  
  // centroids by mun
  var centroidsFiltered = ee.FeatureCollection(centroids.filter(filter))
  
  // munFeature
  var munFeature = setCens.filter(filter).geometry()
  
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
  
  return ee.FeatureCollection(centroidsFiltered.map(distanceCalcToEachCentroid))
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
