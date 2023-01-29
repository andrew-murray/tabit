import SongLoaders from '../SongLoaders';

test('SongLoaders LoadExample', async () => {
  const loadedState = SongLoaders.LoadExample()
    .catch(err => {
        fail(err);
    })
});
