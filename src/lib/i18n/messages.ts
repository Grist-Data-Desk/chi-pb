export type Language = 'en' | 'es';

interface Messages {
	hed: string;
	dek: string;
	search: {
		button: string;
		noResults: string;
	};
	credits: {
		importantInformation: string;
		dataDisclaimer: string;
		sources: string;
		cityOfChicago: string;
		censusBureau: string;
		analysis: string;
		development: string;
		seeOur: string;
		methods: string;
	};
	notes: {
		button: string;
	};
	legend: {
		title: string;
		aggregationLevel: {
			label: string;
			censusTractsButton: string;
			communityAreasButton: string;
		};
		dataVisualization: {
			label: string;
			leadButton: string;
			povertyButton: string;
			raceButton: string;
		};
		variable: {
			pctRequiresReplacementLabel: string;
			pctPovertyLabel: string;
			pctRaceLabel: string;
		};
		annotation: {
			censusTracts: string;
			communityAreas: string;
		};
		loading: string;
	};
	selectedAddress: {
		label: string;
		leadStatus: {
			label: string;
			loading: string;
			L: string;
			GRR: string;
			NL: string;
			U: string;
		};
		addressNotFound: string;
		multipleServiceLines: ({ count }: { count: number }) => string;
		share: {
			button: string;
		};
	};
	tabs: {
		serviceLineInformationTabTitle: string;
		serviceLineInventoryTabTitle: string;
		demographicContextTabTitle: string;
	};
	serviceLineInformation: {
		loading: string;
		linesFound: string;
		leadStatus: {
			label: string;
			loading: string;
			C: string;
			CLS: string;
			G: string;
			GRR: string;
			L: string;
			NL: string;
			O: string;
			P: string;
			U: string;
			UNL: string;
			Unknown: string;
		};
		components: {
			publicSide: string;
			privateSide: string;
			waterMain: string;
			gooseneck: string;
			utilityPortion: string;
			customerPortion: string;
			ofServiceLine: string;
			utilitySide: string;
			customerSide: string;
		};
		split: {
			unknown: string;
			notLead: string;
			galvanized: string;
			requiring: string;
			replacement: string;
			castDuctile: string;
			orTransite: string;
			copper: string;
			noLeadSolder: string;
			leadSolder: string;
			plastic: string;
			pvchdpepex: string;
		};
		pagination: {
			nextButton: string;
			previousButton: string;
			lineOf: ({ current, total }: { current: number; total: number }) => string;
		};
		exceptions: {
			highRisk: string;
			detailedInventoryUnavailable: string;
			leadStatusFromGeocoder: string;
		};
	};
	areaContext: {
		locatedIn: string;
		statisticsOn: {
			communityArea: string;
			censusTract: string;
		};
		interaction: {
			tap: string;
			hoverOver: string;
		};
		learnMore: string;
	};
	serviceLineInventory: {
		lead: string;
		suspectedLead: string;
		galvanizedReplace: string;
		nonLead: string;
		total: string;
		requiresReplacement: string;
	};
	demographicContext: {
		medianHouseholdIncome: string;
		povertyRate: string;
		blackPopulation: string;
		latinoPopulation: string;
		whitePopulation: string;
		asianPopulation: string;
		nonWhitePopulation: string;
	};
	tooltips: {
		definitions: {
			lead: string;
			suspectedLead: string;
			galvanized: string;
			nonLead: string;
		};
	};
	resources: {
		button: string;
		title: string;
		resultDescription: ({ plural }: { plural: boolean }) => string;
		freeWaterTestingKit: {
			label: string;
			description: string;
			CTA: string;
		};
		freeWaterFilter: {
			label: string;
			description: string;
			CTA: string;
		};
		leadPipeReplacementAssistance: {
			label: string;
			description: string;
			CTA: string;
		};
	};
	share: {
		title: string;
		downloadImage: string;
		saveToShare: string;
		image: {
			iLookedUp: string;
			in: string;
			and: string;
			foundOut: string;
			serviceLineMadeOf: string;
			leadStatus: {
				L: string;
				GRR: string;
				NL: string;
				U: string;
				Unknown: string;
			};
			checkYourLeadStatus: string;
		};
	};
}

export const messages: Record<Language, Messages> = {
	en: {
		hed: 'Chicago: Does your water service line contain lead?',
		dek: 'Enter your address to find out whether any part of your water service line needs replacing and how your neighborhood compares to others.',
		search: {
			button: 'Search',
			noResults: 'No inventory results found. Showing general address search:'
		},
		credits: {
			importantInformation: 'Important Information',
			dataDisclaimer:
				"Data is current as of the city's 2025 water service line inventory. The city's data is incomplete and might contain inaccuracies and duplicates. Multiple addresses might be served by the same service line. Some addresses will appear as ranges. We encourage users to independently verify any information before acting on it.",
			sources: 'Sources',
			cityOfChicago: 'City of Chicago',
			censusBureau: 'Census Bureau',
			analysis: 'Analysis',
			development: 'Development',
			seeOur: 'See our',
			methods: 'methods'
		},
		notes: {
			button: 'Notes'
		},
		legend: {
			title: 'Select a data layer to visualize',
			aggregationLevel: {
				label: 'Aggregation level',
				censusTractsButton: 'Census tracts',
				communityAreasButton: 'Community areas'
			},
			dataVisualization: {
				label: 'Data visualization',
				leadButton: 'Lead',
				povertyButton: 'Poverty',
				raceButton: 'Race'
			},
			variable: {
				pctRequiresReplacementLabel: 'Percentage of service lines requiring replacement',
				pctPovertyLabel: 'Percentage of population below poverty line',
				pctRaceLabel: 'Percentage of population that is non-white'
			},
			annotation: {
				censusTracts:
					'Color boxes are sized proportionally to the number of census tracts they contain, with finer detail offered for the top and bottom of the range.',
				communityAreas:
					'Color boxes are sized proportionally to the number of community areas they contain, with finer detail offered for the top and bottom of the range.'
			},
			loading: 'Loading...'
		},
		selectedAddress: {
			label: 'Selected address',
			leadStatus: {
				label: 'Lead Status',
				loading: 'Loading...',
				L: 'Lead',
				GRR: 'Galvanized (Replace)',
				NL: 'Non-Lead',
				U: 'Suspected Lead'
			},
			addressNotFound:
				"The address you searched is not in the city of Chicago's water service line inventory. However, you can click on a nearby service line dot to view its corresponding inventory entry.",
			multipleServiceLines: ({ count }) =>
				`This address is associated with ${count} service line records. The status shown above represents the 'worst-case' scenario across all lines: If suspected lead appears in any of the service lines, it'll be noted here. See individual line details below.`,
			share: {
				button: 'Share'
			}
		},
		tabs: {
			serviceLineInformationTabTitle: 'Service line\ninformation',
			serviceLineInventoryTabTitle: 'Service line\ninventory',
			demographicContextTabTitle: 'Demographic\ncontext'
		},
		serviceLineInformation: {
			loading: 'Loading service line information...',
			linesFound: 'lines found at this address',
			leadStatus: {
				label: 'Lead Status',
				loading: 'Loading...',
				C: 'Copper - No Lead Solder',
				CLS: 'Copper - Lead Solder',
				G: 'Galvanized',
				GRR: 'Galvanized Requiring Replacement',
				L: 'Lead',
				NL: 'Non-Lead',
				O: 'Cast/Ductile Iron or Transite',
				P: 'Plastic - PVC, HDPE, PEX',
				U: 'Suspected Lead',
				UNL: 'Unknown (Not Lead)',
				Unknown: 'Unknown'
			},
			components: {
				publicSide: 'Public Side',
				privateSide: 'Private Side',
				waterMain: 'Water main',
				gooseneck: 'Gooseneck',
				utilityPortion: 'Utility portion',
				customerPortion: 'Customer portion',
				ofServiceLine: 'of service line',
				utilitySide: 'Utility Side',
				customerSide: 'Customer Side'
			},
			split: {
				unknown: 'Unknown',
				notLead: '(Not Lead)',
				galvanized: 'Galvanized',
				requiring: 'Requiring',
				replacement: 'Replacement',
				castDuctile: 'Cast/Ductile Iron',
				orTransite: 'or Transite',
				copper: 'Copper -',
				noLeadSolder: 'No Lead Solder',
				leadSolder: 'Lead Solder',
				plastic: 'Plastic',
				pvchdpepex: 'PVC, HDPE, PEX'
			},
			pagination: {
				nextButton: 'Next',
				previousButton: 'Previous',
				lineOf: ({ current, total }) => `Line ${current} of ${total}`
			},
			exceptions: {
				highRisk: '⚠️ This address is considered a high-risk property by the city of Chicago.',
				detailedInventoryUnavailable:
					'Detailed inventory information is not available for this address.',
				leadStatusFromGeocoder:
					'The basic lead status shown above is based on available data from the geocoded address database.'
			}
		},
		areaContext: {
			locatedIn: 'This address is located in',
			statisticsOn: {
				communityArea: 'Statistics on this community area appear below.',
				censusTract: 'Statistics on this census tract appear below.'
			},
			interaction: {
				tap: 'Tap',
				hoverOver: 'Hover over'
			},
			learnMore: 'a line classification to learn more.'
		},
		serviceLineInventory: {
			lead: 'Lead',
			suspectedLead: 'Suspected Lead',
			galvanizedReplace: 'Galvanized (Replace)',
			nonLead: 'Non-Lead',
			total: 'Total',
			requiresReplacement: 'Requires Replacement'
		},
		demographicContext: {
			medianHouseholdIncome: 'Median Household Income',
			povertyRate: 'Poverty Rate',
			blackPopulation: 'Black Population',
			latinoPopulation: 'Latino Population',
			whitePopulation: 'White Population',
			asianPopulation: 'Asian Population',
			nonWhitePopulation: 'Nonwhite Population'
		},
		tooltips: {
			definitions: {
				lead: 'At least one component of the service line is known to be made of lead.',
				suspectedLead:
					"The composition of the service line is marked unknown in the city's inventory, but is suspected to contain lead components, usually based on the building's age.",
				galvanized:
					'No components of the service line are known to be made of lead, but at least one part is made of galvanized steel, which can become contaminated with lead from upstream pipes.',
				nonLead:
					'None of the components of the service line are made of or may be contaminated with lead.'
			}
		},
		resources: {
			button: 'Resources for Selected Address',
			title: 'What can I do?',
			resultDescription: ({ plural }) =>
				`Based on your service line result, the following ${plural ? 'resources are' : 'resource is'} available to you:`,
			freeWaterTestingKit: {
				label: 'Free Water Testing Kit',
				description:
					'All Chicago residents can request a free water testing kit to check lead levels.',
				CTA: 'Request a free water testing kit'
			},
			freeWaterFilter: {
				label: 'Free Water Filter',
				description:
					'Check if your address qualifies for a free water filter from the city of Chicago.',
				CTA: 'Register for a free water filter'
			},
			leadPipeReplacementAssistance: {
				label: 'Lead Pipe Replacement Assistance',
				description:
					'Depending on your household income, you may qualify for free lead pipe replacement.',
				CTA: 'Apply for replacement assistance'
			}
		},
		share: {
			title: 'Share your results',
			downloadImage: 'Download image',
			saveToShare: 'Save this image to share on social media',
			image: {
				iLookedUp: 'I looked up my address',
				in: 'in',
				and: 'and',
				foundOut: 'found out the water',
				serviceLineMadeOf: 'service line is made of',
				leadStatus: {
					L: 'Lead',
					GRR: 'Galvanized Requiring Replacement',
					NL: 'Non-Lead',
					U: 'Suspected Lead',
					Unknown: 'Unknown'
				},
				checkYourLeadStatus: 'check your lead status'
			}
		}
	},
	es: {
		hed: '¿Las pipas de agua de tu propiedad contienen plomo?',
		dek: 'Escribe tu dirección para saber si tu línea de servicio de agua necesita ser reemplazada y cómo se compara tu vecindario con otros.',
		search: {
			button: 'Buscar',
			noResults:
				'No se encontraron resultados de inventario. Se muestra un resultado generalizado de la dirección:'
		},
		credits: {
			importantInformation: 'Información importante',
			dataDisclaimer:
				'Los datos están actualizados según el inventario de líneas de servicio de agua de la ciudad en 2025. Los datos municipales están incompletos y podrían contener inexactitudes y repeticiones. Es posible que varias direcciones reciban el servicio de la misma línea de servicio. Algunas direcciones aparecerán como rangos. Recomendamos a los usuarios que verifiquen la información de forma independiente antes de tomar decisiones.',
			sources: 'Fuentes',
			cityOfChicago: 'Ciudad de Chicago',
			censusBureau: 'Buró del Censo',
			analysis: 'Análisis',
			development: 'Producción',
			seeOur: 'Ve nuestros',
			methods: 'métodos'
		},
		notes: {
			button: 'Notas'
		},
		legend: {
			title: 'Selecciona una capa de datos para visualizarla',
			aggregationLevel: {
				label: 'Nivel de agregación',
				censusTractsButton: 'Áreas comunitarias',
				communityAreasButton: 'Tramos del Censo'
			},
			dataVisualization: {
				label: 'Visualización de datos',
				leadButton: 'Plomo',
				povertyButton: 'Pobreza',
				raceButton: 'Raza'
			},
			variable: {
				pctRequiresReplacementLabel: 'Porcentaje de líneas de servicio que requieren reemplazo',
				pctPovertyLabel: 'Porcentaje de población por debajo de la línea de pobreza',
				pctRaceLabel: 'Porcentaje de población que no es blanca'
			},
			annotation: {
				censusTracts:
					'Los cuadros de color tienen un tamaño proporcional al número de áreas comunitarias que contienen, y se ofrecen detalles más pequeños en cada extremo del rango.',
				communityAreas:
					'Los cuadros de color tienen un tamaño proporcional al número de tramos del Censo que contienen, y se ofrecen detalles más pequeños en cada extremo del rango.'
			},
			loading: 'Cargando...'
		},
		selectedAddress: {
			label: 'Dirección seleccionada',
			leadStatus: {
				label: 'Estado de plomo',
				loading: 'Cargando...',
				L: 'Plomo',
				GRR: 'Acero galvanizado (Reemplazar)',
				NL: 'Sin plomo',
				U: 'Sospecha de plomo'
			},
			addressNotFound:
				'La dirección que buscas no figura en el inventario de líneas de agua de la Ciudad de Chicago. Sin embargo, puedes hacer clic en una línea de servicio cercana para ver su condición.',
			multipleServiceLines: ({ count }) =>
				`Esta dirección está asociada con ${count} registros de la línea de servicio. La condición que se muestra arriba representa el peor caso posible en todas las líneas: Si se sospecha la presencia de plomo en alguna de las líneas de servicio, se indicará aquí. Consulta los detalles de cada línea a continuación.`,
			share: {
				button: 'Compartir'
			}
		},
		tabs: {
			serviceLineInformationTabTitle: 'Información de la\nlínea de servicio',
			serviceLineInventoryTabTitle: 'Inventario de la\nlínea de servicio',
			demographicContextTabTitle: 'Contexto\ndemográfico'
		},
		serviceLineInformation: {
			loading: 'Cargando información de la línea de servicio...',
			linesFound: 'líneas en esta dirección',
			leadStatus: {
				label: 'Estado de plomo',
				loading: 'Cargando...',
				C: 'Cobre - Soldadura sin Plomo',
				CLS: 'Cobre - Soldadura con Plomo',
				G: 'Acero Galvanizado',
				GRR: 'Acero Galvanizado que Requiere Reemplazo',
				L: 'Plomo',
				NL: 'Sin Plomo',
				O: 'Hierro Fundido o Fibrocemento',
				P: 'Plástico - PVC, HDPE, PEX',
				U: 'Sospecha de Plomo',
				UNL: 'Desconocido (Sin Plomo)',
				Unknown: 'Desconocido'
			},
			components: {
				publicSide: 'Lado Público',
				privateSide: 'Lado Privado',
				waterMain: 'Tubería de agua',
				gooseneck: 'Conector',
				utilityPortion: 'Porción de servicio público',
				customerPortion: 'Porción del cliente',
				ofServiceLine: 'de la línea de servicio',
				utilitySide: 'Lado de servicio público',
				customerSide: 'Lado del cliente de la línea de servicio'
			},
			split: {
				unknown: 'Desconocido',
				notLead: '(Sin Plomo)',
				galvanized: 'Acero Galvanizado',
				requiring: 'que Requiere',
				replacement: 'Reemplazo',
				castDuctile: 'Hierro Fundido',
				orTransite: 'o Fibrocemento',
				copper: 'Cobre -',
				noLeadSolder: 'Soldadura sin Plomo',
				leadSolder: 'Soldadura con Plomo',
				plastic: 'Plástico - ',
				pvchdpepex: 'PVC, HDPE, PEX'
			},
			pagination: {
				nextButton: 'Próxima',
				previousButton: 'Anterior',
				lineOf: ({ current, total }) => `Línea ${current} de ${total}`
			},
			exceptions: {
				highRisk:
					'⚠️ Esta dirección es considerada una propiedad de alto riesgo por la ciudad de Chicago.',
				detailedInventoryUnavailable:
					'Información detallada del inventario no está disponible para esta dirección.',
				leadStatusFromGeocoder:
					'La condición básica de plomo que se muestra arriba es según los datos disponibles en la base de datos de direcciones geocodificadas.'
			}
		},
		areaContext: {
			locatedIn: 'Esta dirección se encuentra en',
			statisticsOn: {
				communityArea: 'Las estadísticas de esta area comunitaria se encuentran abajo.',
				censusTract: 'Las estadísticas sobre este tramo del Censo aparecen a continuación.'
			},
			interaction: {
				tap: 'Haz clic en',
				hoverOver: 'Pasa el cursor sobre'
			},
			learnMore: 'una condición de línea para obtener más información.'
		},
		serviceLineInventory: {
			lead: 'Plomo',
			suspectedLead: 'Sospecha de plomo',
			galvanizedReplace: 'Acero galvanizado (Reemplazar)',
			nonLead: 'Sin plomo',
			total: 'Total',
			requiresReplacement: 'Requiere reemplazar'
		},
		demographicContext: {
			medianHouseholdIncome: 'Ingreso promedio',
			povertyRate: 'Tasa de pobreza',
			blackPopulation: 'Población afroamericana',
			latinoPopulation: 'Población latina',
			whitePopulation: 'Población blanca anglosajona',
			asianPopulation: 'Población asiática',
			nonWhitePopulation: 'Población no-blanca anglosajona'
		},
		tooltips: {
			definitions: {
				lead: 'Se sabe que al menos un componente de la línea de servicio está hecho de plomo.',
				suspectedLead:
					'La composición de la línea de servicio está marcada como desconocida en el inventario municipal, pero se sospecha que contiene componentes de plomo, generalmente debido a la antigüedad del edificio.',
				galvanized:
					'No se sabe de algún componente de la línea de servicio que esté hecho de plomo, pero al menos una parte es de acero galvanizado, que puede contaminarse con plomo de las tuberías de agua más elevadas.',
				nonLead:
					'Ninguno de los componentes de la línea de servicio está hecho ni puede estar contaminado con plomo.'
			}
		},
		resources: {
			button: 'Recursos para dirección seleccionada',
			title: '¿Qué puedo hacer?',
			resultDescription: ({ plural }) =>
				`Según el resultado de su línea de servicio, ${plural ? 'los siguientes recursos están disponibles' : 'el siguiente recurso está disponible'}`,
			freeWaterTestingKit: {
				label: 'Kit de pruebas de agua gratuito',
				description:
					'Todos los residentes de Chicago pueden solicitar un kit de prueba de agua gratuito para verificar los niveles de plomo.',
				CTA: 'Solicita un kit de pruebas de agua gratis'
			},
			freeWaterFilter: {
				label: 'Filtro de agua gratuito',
				description:
					'Verifica si su dirección califica para un filtro de agua gratuito de la ciudad de Chicago.',
				CTA: 'Inscríbete para un filtro de agua gratis'
			},
			leadPipeReplacementAssistance: {
				label: 'Ayuda para reemplazar las pipas con plomo',
				description:
					'Dependiendo de tus ingresos, podrías calificar para el reemplazo gratuito de tuberías de plomo.',
				CTA: 'Solicita ayuda para reemplazarlas'
			}
		},
		share: {
			title: 'Comparte tus resultados',
			downloadImage: 'Descargar imagen',
			saveToShare: 'Guardar esta imagen para compartir en redes sociales',
			image: {
				iLookedUp: 'Busqué mi dirección',
				in: 'en',
				and: 'y',
				foundOut: 'aprendí',
				serviceLineMadeOf: 'de qué está hecha mi línea de servicio de agua',
				leadStatus: {
					L: 'Plomo',
					GRR: 'Acero galvanizado que requiere reemplazo',
					NL: 'Sin plomo',
					U: 'Sospecha de plomo',
					Unknown: 'Desconocido'
				},
				checkYourLeadStatus: 'revisa la condición de plomo de tu hogar'
			}
		}
	}
};
