export const FALLBACK_DATA = {
  routes: [
    {
      id: 0,
      label: "cheapest",
      name: "Budget Express",
      totalPrice: 2840,
      totalDuration: "9h 15m",
      transfers: 1,
      legs: [
        {mode: "train", name: "Vande Bharat 22436", origin: "LKO", destination: "NDLS", departureTime: "06:00", arrivalTime: "09:50", price: 1200},
        {mode: "flight", name: "IndiGo 6E201", origin: "DEL", destination: "BOM", departureTime: "11:30", arrivalTime: "13:45", price: 1640}
      ]
    },
    {
      id: 1,
      label: "fastest",
      name: "Non-stop Jet",
      totalPrice: 4200,
      totalDuration: "2h 10m",
      transfers: 0,
      legs: [
        {mode: "flight", name: "IndiGo 6E441", origin: "LKO", destination: "BOM", departureTime: "06:30", arrivalTime: "08:40", price: 4200}
      ]
    }
  ],
  flights: [],
  trains: [],
  taxi: [],
  buses: []
};
