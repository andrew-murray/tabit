
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
      id: "646e780db89b1e2299a4335c",
      name: "Jam (not-played)"
    },
    {
      id: "646e90f18e4aa6225ea39212",
      name: "Hellaswolla (not-played)"
    },
    {
      id: "646e78f7b89b1e2299a433c9",
      name: "Wibbly"
    },
    {
      id: "646e7d2c8e4aa6225ea3895c",
      name: "Give It Up"
    },
    {
      id: "646e82adb89b1e2299a437f2",
      name: "Horse"
    },
    {
      id: "646e8e1f8e4aa6225ea390ce",
      name: "Pleasure"
    }
  ]
};

const Songbooks = {
  "beasties-beltane-2023" : Beastie2023Collection,
  "enc" : ENCCollection
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

const storage = { get };

export default storage;