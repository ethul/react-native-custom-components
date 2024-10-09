'use strict';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

const BASE_SCENE_STYLE = {
  position: 'absolute',
  overflow: 'hidden',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
};

const DEFAULT_SCENE_STYLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  transitioner: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  baseScene: BASE_SCENE_STYLE,
});

const Navigator = forwardRef(({
  initialRouteStack,
  initialRoute,
  renderScene,
  sceneStyle = DEFAULT_SCENE_STYLE,
  navigationBar,
}, ref) => {
  const [routeStack, setRouteStack] = useState(initialRouteStack || [initialRoute]);

  const [presentedIndex, setPresentedIndex] = useState(routeStack.length - 1);

  const push = (route) => {
    setRouteStack((prevStack) => {
      const newStack = [...prevStack, route];

      setPresentedIndex(newStack.length - 1);

      return newStack;
    });
  };

  const popN = (n) => {
    setRouteStack((prevStack) => {
      const m = Math.min(prevStack.length - 1, n);

      const newStack = m === 0 ? prevStack : prevStack.slice(0, -1 * m);

      setPresentedIndex(newStack.length - 1);

      return newStack;
    });
  };

  const pop = () => popN(1);

  const popToRoute = (route) => {
    const index = routeStack.findIndex((a) => {
      return a.__navigatorRouteID === route.__navigatorRouteID;
    });

    if (index !== -1) {
      popN(routeStack.length - (index + 1));
    }
  };

  const replaceAtIndex = (index, route) => {
    setRouteStack((prevStack) => {
      const updatedStack = [...prevStack];

      if (index >= 0 && index < prevStack.length) {
        updatedStack[index] = route;
      }

      return updatedStack;
    });
  };

  const replace = (route) => replaceAtIndex(presentedIndex, route);

  const replacePrevious = (route) => replaceAtIndex(presentedIndex - 1, route);

  const replacePreviousAndPop = (route) => {
    replacePrevious(route);
    pop();
  };

  const resetTo = (route) => {
    setRouteStack([route]);  // Reset the stack to only the new route
    setPresentedIndex(0);  // Reset to the single route
  };

  const jumpTo = (index) => {
    if (index >= 0 && index < routeStack.length) {
      setPresentedIndex(index);
    }
  };

  const jumpForward = () => {
    setPresentedIndex((prevIndex) => {
      if (prevIndex < routeStack.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const jumpBack = () => {
    setPresentedIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  const popToTop = () => {
    setPresentedIndex((prevIndex) => {
      if (prevIndex > 0) {
        setRouteStack((prevStack) => prevStack.slice(0, 1));  // Keep only the top route

        return 0;  // Reset presentedIndex to 0
      }
      return prevIndex;
    });
  };

  const immediatelyResetRouteStack = (newStack) => {
    setRouteStack(newStack);  // Immediately replace the entire stack
    setPresentedIndex(newStack.length - 1);
  };

  const getCurrentRoutes = () => routeStack;

  // Expose methods through ref for external use
  useImperativeHandle(ref, () => ({
    push,
    pop,
    popN,
    replace,
    replaceAtIndex,
    replacePrevious,
    replacePreviousAndPop,
    resetTo,
    jumpTo,
    jumpForward,
    jumpBack,
    popToTop,
    popToRoute,
    immediatelyResetRouteStack,
    getCurrentRoutes,
  }));

  const renderScenes = () => {
    return routeStack.map((route, index) => {
      const {entering, exiting} = route.sceneConfig || {entering: null, exiting: null};

      const style = [
        styles.baseScene,
        sceneStyle,
        {zIndex: index}
      ];

      return (
        <Animated.View
          key={route.__navigatorRouteID}
          style={style}
          entering={entering}
          exiting={exiting}>
          {renderScene(route)}
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.transitioner}>{renderScenes()}</View>
      {navigationBar && React.cloneElement(navigationBar, {
        navigator: {
          routeStack,
          immediatelyResetRouteStack,
          jumpTo,
          jumpForward,
          jumpBack,
          push,
          popN,
          pop,
          replaceAtIndex,
          replace,
          replacePrevious,
          popToTop,
          popToRoute,
          replacePreviousAndPop,
          resetTo,
          getCurrentRoutes
        },
        navState: {
          routeStack,
          presentedIndex
        }
      })}
    </View>
  );
});

Navigator.NavigationBar = require('./NavigatorNavigationBar');

Navigator.SceneConfigs = require('./NavigatorSceneConfigs');

export default Navigator;
