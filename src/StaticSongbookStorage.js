
const Beastie2023Collection = {
  id: "beasties-beltane-2023",
  name: "Beasties Beltane 2023",
  style: {
    grid: {
      backgroundColor: '#E01B1B',
      color: "#ffffff"
    }
  },
  songs: [
    {
      id: "640ddf7bebd26539d08d5cd7",
      name:  "Raised by wolves"
    },
    {
      id: "640de010ace6f33a22ed8529",
      name: "Give it up"
    },
    {
      id: "640bc37eace6f33a22ecc67f",
      name: "Express"
    },
    {
      id: "641f0c03c0e7653a059442b5",
      name: "SmolBeast"
    },
    {
      id: "641f0c0face6f33a22fb2bb6",
      name: "Beat About The Bush"
    },
    {
      id: "641f0ad7ace6f33a22fb29c4",
      name: "HellaSwolla"
    },
    {
      id: "643c6a70ace6f33a220c8dfa",
      name: "Hot Potato"
    },
    {
      id: "643c6891ebd26539d0ac6345",
      name: "Trickster"
    }
  ]
};

const ENCCollection = {
  id: "enc",
  name: "The Noise Committee",
  style: {
    grid: {
      backgroundColor: '#0609EC',
      color: "#ffffff"
    }
  },
  songs: [
    {
      id: "666f78adad19ca34f879f80c",
      name: "Disreputable Pie"
    },
    {
      id: "6477c84d8e4aa6225ea75889",
      name: "Drama Queen [OUT]"
    },
    {
      id: '64767e82b89b1e2299a785b7',
      name: "Gavs Garage"
    },
    {
      id: "646e7d2c8e4aa6225ea3895c",
      name: "Give It Up"
    },
    {
      id: "646e990e8e4aa6225ea3956f",
      name: "Headbreaker"
    },
    {
      id: "646e90f18e4aa6225ea39212",
      name: "Hellaswolla [OUT]"
    },
    {
      id: "666f75beacd3cb34a85871c1",
      name: "HoHo"
    },
    {
      id: "646e82adb89b1e2299a437f2",
      name: "Horse"
    },
    {
      id: "6478e5f28e4aa6225ea7c33a",
      name: "Housetrained [OUT]"
    },
    {
      id: "646e780db89b1e2299a4335c",
      name: "Jam"
    },
    {
      id: "665e0387e41b4d34e4fdfd52",
      name: "NuuNuu"
    },
    {
      id: "646e8e1f8e4aa6225ea390ce",
      name: "Pleasure"
    },
    {
      id: "6565071354105e766fd6580a",
      name: "P6K"
    },
    {
      id: "646e78f7b89b1e2299a433c9",
      name: "Wibbly"
    }
  ]
};


const PucaiCollection = {
  id: "pucai-samhuinn-2024",
  name: "Pucaí Samhuinn 2024",
  style: {
    grid: {
      backgroundColor: '#00ff8f',
      color: "#000000"
    }
  },
  songs: [
    {
      id: "66e218bee41b4d34e42dcf35",
      name: "FoonkToonk"
    },
    {
      id: "66e2134cacd3cb34a882054f",
      name:  "GallowDance"
    }
  ]
};

const Songbooks = {
  "beasties-beltane-2023" : Beastie2023Collection,
  "enc" : ENCCollection,
  "pucai" : PucaiCollection,
};


const get = (songbookID) => {
  if(songbookID in Songbooks)
  {
    return Promise.resolve(Songbooks[songbookID]);
  }
  else
  {
    const err = new Error(`Couldn't find songbook with id '${songbookID}'`);
    return Promise.reject(err);
  }
};

const getAll = () => {
  // the pucai book is hidden for now
  // Object.values(Songbooks)
  return [Beastie2023Collection, ENCCollection].map( e => { return {
    source: "static",
    data: e
  };});
};

const storage = { get, getAll };

export default storage;