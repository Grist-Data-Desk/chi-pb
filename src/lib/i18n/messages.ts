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
			galvanizedRequiring: string;
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
				galvanizedRequiring: 'Galvanized Requiring',
				replacement: 'Replacement',
				castDuctile: 'Cast/Ductile Iron',
				orTransite: 'or Transite',
				copper: 'Copper',
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
		hed: 'TK',
		dek: 'TK',
		search: {
			button: 'TK',
			noResults: 'TK'
		},
		credits: {
			importantInformation: 'TK',
			dataDisclaimer: 'TK',
			sources: 'TK',
			cityOfChicago: 'TK',
			censusBureau: 'TK',
			analysis: 'TK',
			development: 'TK',
			seeOur: 'TK',
			methods: 'TK'
		},
		notes: {
			button: 'TK'
		},
		legend: {
			title: 'TK',
			aggregationLevel: {
				label: 'TK',
				censusTractsButton: 'TK',
				communityAreasButton: 'TK'
			},
			dataVisualization: {
				label: 'TK',
				leadButton: 'TK',
				povertyButton: 'TK',
				raceButton: 'TK'
			},
			variable: {
				pctRequiresReplacementLabel: 'TK',
				pctPovertyLabel: 'TK',
				pctRaceLabel: 'TK'
			},
			annotation: {
				censusTracts: 'TK',
				communityAreas: 'TK'
			},
			loading: 'TK'
		},
		selectedAddress: {
			label: 'TK',
			leadStatus: {
				label: 'TK',
				loading: 'TK',
				L: 'TK',
				GRR: 'TK',
				NL: 'TK',
				U: 'TK'
			},
			addressNotFound: 'TK',
			multipleServiceLines: ({ count }) => `TK ${count}`,
			share: {
				button: 'TK'
			}
		},
		tabs: {
			serviceLineInformationTabTitle: 'TK',
			serviceLineInventoryTabTitle: 'TK',
			demographicContextTabTitle: 'TK'
		},
		serviceLineInformation: {
			loading: 'TK',
			linesFound: 'TK',
			leadStatus: {
				label: 'TK',
				loading: 'TK',
				C: 'TK',
				CLS: 'TK',
				G: 'TK',
				GRR: 'TK',
				L: 'TK',
				NL: 'TK',
				O: 'TK',
				P: 'TK',
				U: 'TK',
				UNL: 'TK',
				Unknown: 'TK'
			},
			components: {
				publicSide: 'TK',
				privateSide: 'TK',
				waterMain: 'TK',
				gooseneck: 'TK',
				utilityPortion: 'TK',
				customerPortion: 'TK',
				ofServiceLine: 'TK',
				utilitySide: 'TK',
				customerSide: 'TK'
			},
			split: {
				unknown: 'TK',
				galvanizedRequiring: 'TK',
				replacement: 'TK',
				castDuctile: 'TK',
				orTransite: 'TK',
				copper: 'TK',
				noLeadSolder: 'TK',
				leadSolder: 'TK',
				plastic: 'TK',
				pvchdpepex: 'TK'
			},
			pagination: {
				nextButton: 'TK',
				previousButton: 'TK',
				lineOf: ({ current, total }) => `TK ${current} TK ${total}`
			},
			exceptions: {
				highRisk: 'TK',
				detailedInventoryUnavailable: 'TK',
				leadStatusFromGeocoder: 'TK'
			}
		},
		areaContext: {
			locatedIn: 'TK',
			statisticsOn: {
				communityArea: 'TK',
				censusTract: 'TK'
			},
			interaction: {
				tap: 'TK',
				hoverOver: 'TK'
			},
			learnMore: 'TK'
		},
		serviceLineInventory: {
			lead: 'TK',
			suspectedLead: 'TK',
			galvanizedReplace: 'TK',
			nonLead: 'TK',
			total: 'TK',
			requiresReplacement: 'TK'
		},
		demographicContext: {
			medianHouseholdIncome: 'TK',
			povertyRate: 'TK',
			blackPopulation: 'TK',
			latinoPopulation: 'TK',
			whitePopulation: 'TK',
			asianPopulation: 'TK',
			nonWhitePopulation: 'TK'
		},
		tooltips: {
			definitions: {
				lead: 'TK',
				suspectedLead: 'TK',
				galvanized: 'TK',
				nonLead: 'TK'
			}
		},
		resources: {
			button: 'TK',
			title: '¿Qué puedo hacer?',
			resultDescription: ({ plural }) => `TK ${plural ? 'TK' : 'TK'}`,
			freeWaterTestingKit: {
				label: 'TK',
				description: 'TK',
				CTA: 'TK'
			},
			freeWaterFilter: {
				label: 'TK',
				description: 'TK',
				CTA: 'TK'
			},
			leadPipeReplacementAssistance: {
				label: 'TK',
				description: 'TK',
				CTA: 'TK'
			}
		},
		share: {
			title: 'TK',
			downloadImage: 'TK',
			saveToShare: 'TK',
			image: {
				iLookedUp: 'TK',
				in: 'TK',
				and: 'TK',
				foundOut: 'TK',
				serviceLineMadeOf: 'TK',
				leadStatus: {
					L: 'TK',
					GRR: 'TK',
					NL: 'TK',
					U: 'TK',
					Unknown: 'TK'
				},
				checkYourLeadStatus: 'TK'
			}
		}
	}
};
