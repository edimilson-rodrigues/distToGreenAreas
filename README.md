# 🌿 distToGreenAreas
Codes developed to analyse the access (distance) to green areas in urban areas of São Paulo state. The data is related to the project [UrbVerde](https://urbverde.iau.usp.br/)

# Obtaining the layers used to calculate the distance to green areas
Here are the steps to obtain and analyse the distance to green areas based on OpenStreetMap data. <br>
[1] Urban census tracts <br>
[2] Centroids of urban census tracts <br>
[3] Squares and parks (green areas) <br>
[4] Distance to green areas <br>
[5] Analysing the results

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
- Using the Census tracts, a list of municipalities codes is obtained. 
- Green areas are separated in two groups based on size criteria: 
	* green areas with less than or equals to 5000 m²
	* green areas with greater than 5000 m². 
- For each centroid, the distance to each group of green areas are calculated. Also, the nearest green area is calculated. 
-  All the results are saved as a property of each census tract centroid and exported as an asset.
	Obs. For the case of São Paulo municipality, which the number of census tracts makes the memory been exceed during the calculation, the process is divided in tiles.
- The results are then merged and analysed externally.
<br>
Here is the code we used: 
- For all municipalities: [distToGreen.js](codes/distToGreen.js)
- For São Paulo municipality: [distToGreen_sp.js](codes/distToGreen_sp.js)

## [5] Analysing the results
We provided a Google Colab to analyse the results. Check it [here](https://colab.research.google.com/drive/1FhXUXSK_eeZ9YhH79mLUm2WFbkbAy3k2#scrollTo=TerFJQ6sHZ5s).<br>
There you can find instructions to get the results for your municipality. <br>
<img src="https://drive.google.com/uc?id=1jUbRobWK44NZMjJ34btADciirWbgz-rI">
