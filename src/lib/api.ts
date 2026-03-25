import type { ApiResponse, FungiResult, Language } from '../types';

const API_ENDPOINT = 'https://qlever.dev/api/wikidata-qlever';

const QUERY_TEMPLATE = `
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?pilz ?lat_name ?synonym ?image ?edibility WHERE {
  {
    SELECT ?pilz
           (SAMPLE(?taxon_name) AS ?lat_name)
           (GROUP_CONCAT(DISTINCT ?german_syn; SEPARATOR=", ") AS ?synonym)
           (GROUP_CONCAT(DISTINCT ?edibility_; SEPARATOR="§§") AS ?edibility)
           (SAMPLE(?image_) AS ?image) WHERE {
      ?pilz wdt:P105 wd:Q7432 ;
            wdt:P171* wd:Q764 ;
            skos:altLabel ?german_syn ;
            wdt:P225 ?taxon_name .
      OPTIONAL { ?pilz wdt:P789/rdfs:label ?edibility_ FILTER (LANG(?edibility_) = "en") }
      OPTIONAL { ?pilz wdt:P18 ?image_ }
      FILTER (LANG(?german_syn) = "{{LANG}}")
    }
    GROUP BY ?pilz
  }
  BIND ("{{QUERY}}" AS ?query)
  FILTER (REGEX(?lat_name,?query,"i") || REGEX(?synonym,?query,"i"))
}
`.trim();

function buildQuery(searchQuery: string, lang: Language): string {
  return QUERY_TEMPLATE
    .replace('{{QUERY}}', searchQuery)
    .replace('{{LANG}}', lang);
}

function extractQId(uri: string): string {
  const match = uri.match(/Q\d+/);
  return match ? match[0] : '';
}

function parseResponse(response: ApiResponse): FungiResult[] {
  return response.results.bindings.map((binding) => ({
    pilz: binding.pilz.value,
    latName: binding.lat_name.value,
    synonym: binding.synonym.value,
    qId: extractQId(binding.pilz.value),
    image: binding.image?.value,
    edibility: binding.edibility?.value
      ? binding.edibility.value.split('§§')
      : [],
  }));
}

function rankResults(results: FungiResult[], query: string): FungiResult[] {
  const q = query.toLowerCase().trim();

  const scored = results.map((r) => {
    const latLower = r.latName.toLowerCase();
    const synLower = r.synonym.toLowerCase();

    let score = 0;
    // Exact matches
    if (latLower === q) score = 100;
    else if (synLower === q) score = 60;
    // Starts with
    else if (latLower.startsWith(q)) score = 80;
    else if (synLower.startsWith(q)) score = 40;
    // Contains
    else if (latLower.includes(q)) score = 20;
    else if (synLower.includes(q)) score = 10;

    return { result: r, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.result);
}

export async function searchFungi(
  query: string,
  lang: Language
): Promise<FungiResult[]> {
  if (!query.trim()) {
    return [];
  }

  const sparqlQuery = buildQuery(query.trim(), lang);
  console.log('SPARQL query:', sparqlQuery);

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
    },
    body: `send=10000&query=${encodeURIComponent(sparqlQuery)}`,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: ApiResponse = await response.json();
  return rankResults(parseResponse(data), query);
}
