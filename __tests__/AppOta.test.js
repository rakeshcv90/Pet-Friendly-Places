import codePush from '@revopush/react-native-code-push';

// The root component is wrapped by Revopush, with checking left to the app's own update flow
describe('App over-the-air updates', () => {
  it('wraps the root component with codePush, checking manually', () => {
    jest.isolateModules(() => {
      const wrapper = jest.fn(component => component);
      codePush.mockReturnValueOnce(wrapper);

      const App = require('../App').default;

      expect(codePush).toHaveBeenCalledWith({ checkFrequency: 2 });
      expect(wrapper).toHaveBeenCalledTimes(1);
      expect(typeof App).toBe('function');
    });
  });
});
