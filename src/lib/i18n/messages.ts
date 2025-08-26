export type Language = 'en' | 'es';

interface Messages {
	hed: string;
	dek: string;
	searchButton: string;
	credits: {
		note: string;
		dataDisclaimer: string;
		sources: string;
		analysis: string;
		development: string;
		seeOur: string;
		methods: string;
	};
	notesButton: string;
	resourcesButton: string;
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
	};
	resultsPanel: {
		selectedAddressLabel: string;
		leadStatusLabel: string;
		addressNotFoundDescription: string;
		multipleServiceLinesDescription: ({ count }: { count: number }) => string;
		serviceLineInformationTabTitle: string;
		serviceLineInventoryTabTitle: string;
		demographicContextTabTitle: string;
	};
}

export const messages: Record<Language, Messages> = {
	en: {
		hed: 'Chicago: Does your water service line contain lead?',
		dek: 'Enter your address to find out whether any part of your water service line needs replacing and how your neighborhood compares to others.',
		searchButton: 'Search',
		credits: {
			note: 'Note',
			dataDisclaimer:
				'Data is current as of the city’s 2025 water service line inventory. The city’s data is incomplete and may contain inaccuracies and duplicates. Multiple addresses may be served by the same service line. Some addresses will appear as ranges.',
			sources: 'Sources',
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
				'Color boxes are sized proportionally to the number of census tracts they contain, with finer detail offered for the top and bottom of the range.'
		},
		resultsPanel: {
			selectedAddressLabel: 'Selected address',
			leadStatusLabel: 'Lead status',
			addressNotFoundDescription:
				"The address you searched is not in the city of Chicago's water service line inventory. However, you can click on a nearby service line dot to view its corresponding inventory entry.",
			multipleServiceLinesDescription: ({ count }) =>
				`This address is associated with ${count} service line records. The status shown above represents the 'worst-case' scenario across all lines: If suspected lead appears in any of the service lines, it'll be noted here. See individual line details below.`,
			serviceLineInformationTabTitle: 'Service line\ninformation',
			serviceLineInventoryTabTitle: 'Service line\ninventory',
			demographicContextTabTitle: 'Demographic\ncontext'
		}
	},
	es: {
		hed: 'Chicago: ¿Contiene tu línea de servicio de agua plomo?',
		dek: 'Ingresa tu dirección para saber si alguna parte de tu línea de servicio de agua contiene plomo y cómo compara tu vecindario con otros.',
		searchButton: 'Buscar',
		credits: {
			note: 'Nota',
			dataDisclaimer:
				'Los datos son actuales al inventario de líneas de servicio de agua de la ciudad de 2025. Los datos de la ciudad son incompletos y pueden contener errores y duplicados. Pueden servirse varias direcciones con la misma línea de servicio. Algunas direcciones pueden aparecer como rangos.',
			sources: 'Fuentes',
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
				'Los cuadros de color son proporcionales al número de censos de población que contienen, con un detalle más fino para el rango superior y el inferior.'
		},
		resultsPanel: {
			selectedAddressLabel: 'Dirección seleccionada',
			leadStatusLabel: 'Estado del plomo',
			addressNotFoundDescription:
				'La dirección que buscaste no está en el inventario de líneas de servicio de agua de la ciudad de Chicago. Sin embargo, puedes hacer clic en un punto cercano a la línea de servicio para ver su entrada correspondiente en el inventario.',
			multipleServiceLinesDescription: ({ count }) =>
				`Esta dirección está asociada con ${count} registros de línea de servicio. El estado mostrado arriba representa el 'peor caso' de todas las líneas: Si se detecta plomo en alguna de las líneas, se indicará aquí. Ver detalles de cada línea a continuación.`,
			serviceLineInformationTabTitle: 'Información de línea de servicio',
			serviceLineInventoryTabTitle: 'Inventario de línea de servicio',
			demographicContextTabTitle: 'Contexto de demografía'
		}
	}
};
