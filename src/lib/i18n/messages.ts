export type Language = 'en' | 'es';

interface Messages {
	hed: string;
	dek: string;
	searchButton: string;
	credits: {
		note: string;
		dataDisclaimer: string;
		sources: string;
		cityOfChicago: string;
		censusBureau: string;
		analysis: string;
		development: string;
		seeOur: string;
		methods: string;
	};
	notesButton: string;
	resourcesButton: string;
	search: {
		noResultsFoundDescription: string;
	};
	legend: {
		title: string;
		aggregationLevelLabel: string;
		communityAreaButton: string;
		censusTractsButton: string;
		dataVisualizationLabel: string;
		leadButton: string;
		povertyButton: string;
		raceButton: string;
		pctRequiresReplacementLabel: string;
		pctPovertyLabel: string;
		pctRaceLabel: string;
		annotationCommunityArea: string;
		annotationCensusTracts: string;
		loadingLabel: string;
	};
	selectedAddress: {
		label: string;
		leadStatusLoadingLabel: string;
		leadStatusLabel: string;
		leadStatusLLabel: string;
		leadStatusGRRLabel: string;
		leadStatusNLLabel: string;
		leadStatusSuspectedLeadLabel: string;
		addressNotFoundDescription: string;
	};
	tabs: {
		serviceLineInformationTabTitle: string;
		serviceLineInventoryTabTitle: string;
		demographicContextTabTitle: string;
	};
	serviceLineInformation: {
		linesFoundLabel: string;
		loadingServiceLineInformationLabel: string;
		leadStatusLoadingLabel: string;
		leadStatusLeadLabel: string;
		leadStatusCLabel: string;
		leadStatusCLSLabel: string;
		leadStatusGLabel: string;
		leadStatusGRRLabel: string;
		leadStatusNLLabel: string;
		leadStatusOLabel: string;
		leadStatusPLabel: string;
		leadStatusULabel: string;
		leadStatusUNLLabel: string;
		leadStatusUnknownLabel: string;
		publicSideLabel: string;
		privateSideLabel: string;
		waterMainLabel: string;
		gooseneckLabel: string;
		utilityPortionLabel: string;
		customerPortionLabel: string;
		ofServiceLineLabel: string;
		utilitySideLabel: string;
		customerSideLabel: string;
		splitUnknownLabel: string;
		splitGalvanizedRequiringLabel: string;
		splitReplacementLabel: string;
		splitCastDuctileLabel: string;
		splitOrTransiteLabel: string;
		splitCopperLabel: string;
		splitNoLeadSolderLabel: string;
		splitLeadSolderLabel: string;
		splitPlasticLabel: string;
		splitPVCHDPEPEXLabel: string;
		nextButtonLabel: string;
		previousButtonLabel: string;
		lineOfLabel: ({ current, total }: { current: number; total: number }) => string;
		highRiskDescription: string;
		detailedInventoryUnavailableDescription: string;
		leadStatusFromGeocoderDescription: string;
	};
	resultsPanel: {
		multipleServiceLinesDescription: ({ count }: { count: number }) => string;
	};
	areaContext: {
		locationDescription: string;
		censusTractLabel: string;
		communityAreaStatisticDescription: string;
		censusTractStatisticDescription: string;
		tapLabel: string;
		hoverOverLabel: string;
		serviceLineHelpDescription: string;
	};
	serviceLineInventory: {
		leadLabel: string;
		suspectedLeadLabel: string;
		galvanizedReplaceLabel: string;
		nonLeadLabel: string;
		totalLabel: string;
		requiresReplacementLabel: string;
	};
	demographicContext: {
		medianHouseholdIncomeLabel: string;
		povertyRateLabel: string;
		blackPopulationLabel: string;
		latinoPopulationLabel: string;
		whitePopulationLabel: string;
		asianPopulationLabel: string;
		nonWhitePopulationLabel: string;
	};
	tooltips: {
		leadDefinition: string;
		suspectedLeadDefinition: string;
		galvanizedDefinition: string;
		nonLeadDefinition: string;
	};
	resources: {
		title: string;
		resultDescription: ({ plural }: { plural: boolean }) => string;
		freeWaterTestingKitLabel: string;
		freeWaterTestingKitDescription: string;
		freeWaterTestingKitCTA: string;
		freeWaterFilterLabel: string;
		freeWaterFilterDescription: string;
		freeWaterFilterCTA: string;
		leadPipeReplacementAssistanceLabel: string;
		leadPipeReplacementAssistanceDescription: string;
		leadPipeReplacementAssistanceCTA: string;
	};
}

export const messages: Record<Language, Messages> = {
	en: {
		hed: 'Chicago: Does your water service line contain lead?',
		dek: 'Enter your address to find out whether any part of your water service line needs replacing and how your neighborhood compares to others.',
		searchButton: 'Search',
		search: {
			noResultsFoundDescription: 'No inventory results found. Showing general address search:'
		},
		credits: {
			note: 'Note',
			dataDisclaimer:
				'Data is current as of the city’s 2025 water service line inventory. The city’s data is incomplete and may contain inaccuracies and duplicates. Multiple addresses may be served by the same service line. Some addresses will appear as ranges.',
			sources: 'Sources',
			cityOfChicago: 'City of Chicago',
			censusBureau: 'Census Bureau',
			analysis: 'Analysis',
			development: 'Development',
			seeOur: 'See our',
			methods: 'methods'
		},
		notesButton: 'Notes',
		resourcesButton: 'Resources',
		legend: {
			title: 'Select a data layer to visualize',
			aggregationLevelLabel: 'Aggregation level',
			communityAreaButton: 'Community area',
			censusTractsButton: 'Census tracts',
			dataVisualizationLabel: 'Data visualization',
			leadButton: 'Lead',
			povertyButton: 'Poverty',
			raceButton: 'Race',
			pctRequiresReplacementLabel: 'Percentage of service lines requiring replacement',
			pctPovertyLabel: 'Percentage of population below poverty line',
			pctRaceLabel: 'Percentage of population that is non-white',
			annotationCommunityArea:
				'Color boxes are sized proportionally to the number of community areas they contain, with finer detail offered for the top and bottom of the range.',
			annotationCensusTracts:
				'Color boxes are sized proportionally to the number of census tracts they contain, with finer detail offered for the top and bottom of the range.',
			loadingLabel: 'Loading...'
		},
		selectedAddress: {
			label: 'Selected address',
			leadStatusLoadingLabel: 'Loading...',
			leadStatusLabel: 'Lead status',
			leadStatusLLabel: 'Lead',
			leadStatusGRRLabel: 'Galvanized (Replace)',
			leadStatusNLLabel: 'Non-Lead',
			leadStatusSuspectedLeadLabel: 'Suspected Lead',
			addressNotFoundDescription:
				"The address you searched is not in the city of Chicago's water service line inventory. However, you can click on a nearby service line dot to view its corresponding inventory entry."
		},
		tabs: {
			serviceLineInformationTabTitle: 'Service line\ninformation',
			serviceLineInventoryTabTitle: 'Service line\ninventory',
			demographicContextTabTitle: 'Demographic\ncontext'
		},
		serviceLineInformation: {
			linesFoundLabel: 'lines found at this address',
			loadingServiceLineInformationLabel: 'Loading service line information...',
			leadStatusLoadingLabel: 'Loading...',
			leadStatusLeadLabel: 'Lead',
			leadStatusCLabel: 'Copper - No Lead Solder',
			leadStatusCLSLabel: 'Copper - Lead Solder',
			leadStatusGLabel: 'Galvanized',
			leadStatusGRRLabel: 'Galvanized Requiring Replacement',
			leadStatusNLLabel: 'Non-Lead',
			leadStatusOLabel: 'Cast/Ductile Iron or Transite',
			leadStatusPLabel: 'Plastic - PVC, HDPE, PEX',
			leadStatusULabel: 'Suspected Lead',
			leadStatusUNLLabel: 'Unknown (Not Lead)',
			leadStatusUnknownLabel: 'Unknown Status',
			publicSideLabel: 'Public Side',
			privateSideLabel: 'Private Side',
			waterMainLabel: 'Water main',
			gooseneckLabel: 'Gooseneck',
			utilityPortionLabel: 'Utility portion',
			customerPortionLabel: 'Customer portion',
			ofServiceLineLabel: 'of service line',
			utilitySideLabel: 'Utility Side',
			customerSideLabel: 'Customer Side',
			splitUnknownLabel: 'Unknown',
			splitGalvanizedRequiringLabel: 'Galvanized Requiring',
			splitReplacementLabel: 'Replacement',
			splitCastDuctileLabel: 'Cast/Ductile Iron',
			splitOrTransiteLabel: 'or Transite',
			splitCopperLabel: 'Copper',
			splitNoLeadSolderLabel: 'No Lead Solder',
			splitLeadSolderLabel: 'Lead Solder',
			splitPlasticLabel: 'Plastic',
			splitPVCHDPEPEXLabel: 'PVC, HDPE, PEX',
			nextButtonLabel: 'Next',
			previousButtonLabel: 'Previous',
			lineOfLabel: ({ current, total }) => `Line ${current} of ${total}`,
			highRiskDescription:
				'⚠️ This address is considered a high-risk property by the city of Chicago.',
			detailedInventoryUnavailableDescription:
				'Detailed inventory information is not available for this address.',
			leadStatusFromGeocoderDescription:
				'The basic lead status shown above is based on available data from the geocoded address database.'
		},
		resultsPanel: {
			multipleServiceLinesDescription: ({ count }) =>
				`This address is associated with ${count} service line records. The status shown above represents the 'worst-case' scenario across all lines: If suspected lead appears in any of the service lines, it'll be noted here. See individual line details below.`
		},
		areaContext: {
			locationDescription: 'This address is located in',
			censusTractLabel: 'census tract',
			communityAreaStatisticDescription: 'Statistics on this community area appear below.',
			censusTractStatisticDescription: 'Statistics on this census tract appear below.',
			tapLabel: 'Tap',
			hoverOverLabel: 'Hover over',
			serviceLineHelpDescription: 'a line classification to learn more.'
		},
		serviceLineInventory: {
			leadLabel: 'Lead',
			suspectedLeadLabel: 'Suspected Lead',
			galvanizedReplaceLabel: 'Galvanized (Replace)',
			nonLeadLabel: 'Non-Lead',
			totalLabel: 'Total',
			requiresReplacementLabel: 'Requires Replacement'
		},
		demographicContext: {
			medianHouseholdIncomeLabel: 'Median Household Income',
			povertyRateLabel: 'Poverty Rate',
			blackPopulationLabel: 'Black Population',
			latinoPopulationLabel: 'Latino Population',
			whitePopulationLabel: 'White Population',
			asianPopulationLabel: 'Asian Population',
			nonWhitePopulationLabel: 'Non-White Population'
		},
		tooltips: {
			leadDefinition: 'At least one component of the service line is known to be made of lead.',
			suspectedLeadDefinition:
				"The composition of the service line is marked unknown in the city's inventory, but is suspected to contain lead components, usually based on the building's age.",
			galvanizedDefinition:
				'No components of the service line are known to be made of lead, but at least one part is made of galvanized steel, which can become contaminated with lead from upstream pipes.',
			nonLeadDefinition:
				'None of the components of the service line are made of or may be contaminated with lead.'
		},
		resources: {
			title: 'What can I do?',
			resultDescription: ({ plural }) =>
				`Based on your service line result, the following ${plural ? 'resources are' : 'resource is'} available to you:`,
			freeWaterTestingKitLabel: 'Free Water Testing Kit',
			freeWaterTestingKitDescription:
				'All Chicago residents can request a free water testing kit to check lead levels.',
			freeWaterTestingKitCTA: 'Request a free water testing kit',
			freeWaterFilterLabel: 'Free Water Filter',
			freeWaterFilterDescription:
				'Check if your address qualifies for a free water filter from the city of Chicago.',
			freeWaterFilterCTA: 'Register for a free water filter',
			leadPipeReplacementAssistanceLabel: 'Lead Pipe Replacement Assistance',
			leadPipeReplacementAssistanceDescription:
				'Depending on your household income, you may qualify for free lead pipe replacement.',
			leadPipeReplacementAssistanceCTA: 'Apply for replacement assistance'
		}
	},
	es: {
		hed: 'Chicago: ¿Contiene tu línea de servicio de agua plomo?',
		dek: 'Ingresa tu dirección para saber si alguna parte de tu línea de servicio de agua contiene plomo y cómo compara tu vecindario con otros.',
		searchButton: 'Buscar',
		search: {
			noResultsFoundDescription:
				'No se encontraron resultados del inventario. Mostrando búsqueda general de direcciones:'
		},
		credits: {
			note: 'Nota',
			dataDisclaimer:
				'Los datos son actuales al inventario de líneas de servicio de agua de la ciudad de 2025. Los datos de la ciudad son incompletos y pueden contener errores y duplicados. Pueden servirse varias direcciones con la misma línea de servicio. Algunas direcciones pueden aparecer como rangos.',
			sources: 'Fuentes',
			cityOfChicago: 'Ciudad de Chicago',
			censusBureau: 'Oficina del Censo',
			analysis: 'Análisis',
			development: 'Desarrollo',
			seeOur: 'Ver nuestros',
			methods: 'métodos'
		},
		notesButton: 'Notas',
		resourcesButton: 'Recursos',
		legend: {
			title: 'Selecciona una capa de datos para visualizar',
			aggregationLevelLabel: 'Nivel de agregación',
			communityAreaButton: 'Área comunitaria',
			censusTractsButton: 'Censos de población',
			dataVisualizationLabel: 'Visualización de datos',
			leadButton: 'Plomo',
			povertyButton: 'Pobreza',
			raceButton: 'Raza',
			pctRequiresReplacementLabel: 'Porcentaje de líneas de servicio que requieren reemplazo',
			pctPovertyLabel: 'Porcentaje de población por debajo de la línea de pobreza',
			pctRaceLabel: 'Porcentaje de población que no es blanca',
			annotationCommunityArea:
				'Los cuadros de color son proporcionales al número de áreas comunales que contienen, con un detalle más fino para el rango superior y el inferior.',
			annotationCensusTracts:
				'Los cuadros de color son proporcionales al número de censos de población que contienen, con un detalle más fino para el rango superior y el inferior.',
			loadingLabel: 'Cargando...'
		},
		selectedAddress: {
			label: 'Dirección seleccionada',
			leadStatusLoadingLabel: 'Cargando...',
			leadStatusLabel: 'Estado del plomo',
			leadStatusLLabel: 'Plomo',
			leadStatusGRRLabel: 'Galvanizado (Reemplazar)',
			leadStatusNLLabel: 'No Plomo',
			leadStatusSuspectedLeadLabel: 'Plomo Sospechoso',
			addressNotFoundDescription:
				'La dirección que buscaste no está en el inventario de líneas de servicio de agua de la ciudad de Chicago. Sin embargo, puedes hacer clic en un punto cercano a la línea de servicio para ver su entrada correspondiente en el inventario.'
		},
		tabs: {
			serviceLineInformationTabTitle: 'Información de línea de servicio',
			serviceLineInventoryTabTitle: 'Inventario de línea de servicio',
			demographicContextTabTitle: 'Contexto de demografía'
		},
		serviceLineInformation: {
			linesFoundLabel: 'líneas encontradas en esta dirección',
			loadingServiceLineInformationLabel: 'Cargando información de línea de servicio...',
			leadStatusLoadingLabel: 'Cargando...',
			leadStatusLeadLabel: 'Plomo',
			leadStatusCLabel: 'Cobre - Sin Soldadura de Plomo',
			leadStatusCLSLabel: 'Cobre - Soldadura de Plomo',
			leadStatusGLabel: 'Galvanizado',
			leadStatusGRRLabel: 'Galvanizado Requiriendo Reemplazo',
			leadStatusNLLabel: 'No Plomo',
			leadStatusOLabel: 'Hierro Fundido o Transite',
			leadStatusPLabel: 'Plástico - PVC, HDPE, PEX',
			leadStatusULabel: 'Plomo Sospechoso',
			leadStatusUNLLabel: 'Desconocido (No Plomo)',
			leadStatusUnknownLabel: 'Estado Desconocido',
			publicSideLabel: 'Lado público',
			privateSideLabel: 'Lado privado',
			waterMainLabel: 'Línea principal de agua',
			gooseneckLabel: 'Codo',
			utilityPortionLabel: 'Parte de la utilidad',
			customerPortionLabel: 'Parte del cliente',
			ofServiceLineLabel: 'de la línea de servicio',
			utilitySideLabel: 'Lado de la utilidad',
			customerSideLabel: 'Lado del cliente',
			splitUnknownLabel: 'Desconocido',
			splitGalvanizedRequiringLabel: 'Galvanizado Requiriendo',
			splitReplacementLabel: 'Reemplazo',
			splitCastDuctileLabel: 'Hierro Fundido',
			splitOrTransiteLabel: 'o Transite',
			splitCopperLabel: 'Cobre',
			splitNoLeadSolderLabel: 'Sin Soldadura de Plomo',
			splitLeadSolderLabel: 'Soldadura de Plomo',
			splitPlasticLabel: 'Plástico',
			splitPVCHDPEPEXLabel: 'PVC, HDPE, PEX',
			nextButtonLabel: 'Siguiente',
			previousButtonLabel: 'Anterior',
			lineOfLabel: ({ current, total }) => `Línea ${current} de ${total}`,
			highRiskDescription:
				'⚠️ Esta dirección es considerada una propiedad de alto riesgo por la ciudad de Chicago.',
			detailedInventoryUnavailableDescription:
				'La información detallada del inventario no está disponible para esta dirección.',
			leadStatusFromGeocoderDescription:
				'El estado básico de plomo mostrado arriba se basa en datos disponibles en la base de datos de direcciones geocodificadas.'
		},
		resultsPanel: {
			multipleServiceLinesDescription: ({ count }) =>
				`Esta dirección está asociada con ${count} registros de línea de servicio. El estado mostrado arriba representa el 'peor caso' de todas las líneas: Si se detecta plomo en alguna de las líneas, se indicará aquí. Ver detalles de cada línea a continuación.`
		},
		areaContext: {
			locationDescription: 'Esta dirección se encuentra en',
			censusTractLabel: 'censo de población',
			communityAreaStatisticDescription:
				'Estadísticas en este área comunitaria aparecen a continuación.',
			censusTractStatisticDescription:
				'Estadísticas en este censo de población aparecen a continuación.',
			tapLabel: 'Toca',
			hoverOverLabel: 'Sobrevuela',
			serviceLineHelpDescription: 'una clasificación de línea para aprender más.'
		},
		serviceLineInventory: {
			leadLabel: 'Plomo',
			suspectedLeadLabel: 'Plomo Sospechoso',
			galvanizedReplaceLabel: 'Galvanizado (Reemplazar)',
			nonLeadLabel: 'No Plomo',
			totalLabel: 'Total',
			requiresReplacementLabel: 'Requiere Reemplazo'
		},
		demographicContext: {
			medianHouseholdIncomeLabel: 'Ingreso Medio de la Familia',
			povertyRateLabel: 'Tasa de Pobreza',
			blackPopulationLabel: 'Población Negra',
			latinoPopulationLabel: 'Población Latino',
			whitePopulationLabel: 'Población Blanca',
			asianPopulationLabel: 'Población Asiática',
			nonWhitePopulationLabel: 'Población No Blanca'
		},
		tooltips: {
			leadDefinition:
				'Al menos una parte de la línea de servicio de agua es conocida como de plomo.',
			suspectedLeadDefinition:
				'La composición de la línea de servicio de agua es desconocida en el inventario de la ciudad, pero se sospecha que contiene partes de plomo, usualmente basado en la edad del edificio.',
			galvanizedDefinition:
				'Ninguna parte de la línea de servicio de agua es conocida como de plomo, pero al menos una parte es de acero galvanizado, que puede contaminarse con plomo de las tuberías de agua.',
			nonLeadDefinition:
				'Ninguna parte de la línea de servicio de agua es de plomo o puede estar contaminada con plomo.'
		},
		resources: {
			title: '¿Qué puedo hacer?',
			resultDescription: ({ plural }) =>
				`Basado en el resultado de tu línea de servicio, los siguientes ${plural ? 'recursos están' : 'recurso está'} disponibles para ti:`,
			freeWaterTestingKitLabel: 'Kit de prueba de agua gratis',
			freeWaterTestingKitDescription:
				'Todos los residentes de Chicago pueden solicitar un kit de prueba de agua gratis para verificar los niveles de plomo.',
			freeWaterTestingKitCTA: 'Solicitar un kit de prueba de agua gratis',
			freeWaterFilterLabel: 'Filtro de agua gratis',
			freeWaterFilterDescription:
				'Verifica si tu dirección califica para un filtro de agua gratis de la ciudad de Chicago.',
			freeWaterFilterCTA: 'Registrarse para un filtro de agua gratis',
			leadPipeReplacementAssistanceLabel: 'Asistencia para reemplazo de tuberías de plomo',
			leadPipeReplacementAssistanceDescription:
				'Dependiendo de tu ingreso familiar, es posible que califiques para un reemplazo gratuito de tuberías de plomo.',
			leadPipeReplacementAssistanceCTA: 'Aplicar para reemplazo gratuito'
		}
	}
};
