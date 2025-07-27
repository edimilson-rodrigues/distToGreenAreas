# 🌿 distToGreenAreas
Codes developed to analyse the access (distance) to green areas in urban areas of São Paulo state. The data is related to the project [UrbVerde](https://urbverde.iau.usp.br/)

# Obtaining the layers used to calculate the distance to green areas
[1] Urban census tracts
[2] Centroids of urban census tracts
[3] Squares and parks (green areas)
[4] Distance to green areas

## [1] Urban census tracts
_Type: Feature Collection_

This layer is obtained directly from official data (see [IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/26565-malhas-de-setores-censitarios-divisoes-intramunicipais.html). 
We select only the tracts related to urban areas based on a variable associated to each feature. The layer is ingested in Google Earth Engine manually.

## [2] Centroids of urban census tracts
_Type: Feature Collection_

This layer is obtained within Google Earth Engine. The centroids are calculted and then exported as an asset.
Here is the code we used: [centroidsGen.js](codes/centroidsGen.js)

## [3] Squares and parks (green areas)
_Type: Feature Collection_

This layer is obtained from Open Street Map considering the updated annual data. This layer is ingested in Google Earth Engine manually

## [4] Distance to green areas
_Type: Feature Collection_

This layer is obtained within Google Earth Engine. 
1 - Using the Census tracts, a list of municipalities codes is obtained. 
2 - Green areas are separated in two groups based on size criteria: 
	a) green areas with less than or equals to 5000 m²
	b) green areas with greater than 5000 m². 
3 - For each centroid, the distance to each group of green areas are calculated. Also, the nearest green area is calculated. 
4 -  All the results are saved as a property of each census tract centroid and exported as an asset.
	Obs. For the case of São Paulo municipality, which the number of census tracts makes the memory been exceed during the calculation, the process is divided in tiles.
5 - The results are then merged and analysed externally.
<br>
Here is the code we used: 
- For all municipalities: [distToGreen.js](codes/distToGreen.js)
- For São Paulo municipality: [distToGreen_sp.js](codes/distToGreen_sp.js)

