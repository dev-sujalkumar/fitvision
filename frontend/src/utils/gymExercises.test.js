import { RepCounter } from './gymExercises'

const createSquatKeypoints = (kneeAngle, visibleSides = ['left', 'right']) => {
  const keypoints = Array.from({ length: 17 }, () => [0, 0, 0.9])
  const setLeg = (side, hipIndex, kneeIndex, ankleIndex, offset) => {
    const radians = ((180 - kneeAngle) * Math.PI) / 180
    keypoints[hipIndex] = [offset - 1, 0, visibleSides.includes(side) ? 0.9 : 0.1]
    keypoints[kneeIndex] = [offset, 0, visibleSides.includes(side) ? 0.9 : 0.1]
    keypoints[ankleIndex] = [
      offset + Math.cos(radians),
      Math.sin(radians),
      visibleSides.includes(side) ? 0.9 : 0.1,
    ]
  }

  setLeg('left', 11, 13, 15, 0)
  setLeg('right', 12, 14, 16, 3)
  return keypoints
}

const advanceStateClock = counter => {
  counter.stateStartTime = Date.now() - 150
}

describe('RepCounter squat tracking', () => {
  test('counts a full squat when the user returns to standing', () => {
    const counter = new RepCounter('SQUAT')

    advanceStateClock(counter)
    counter.update(createSquatKeypoints(175))
    advanceStateClock(counter)
    expect(counter.update(createSquatKeypoints(145)).state).toBe('descent')
    expect(counter.update(createSquatKeypoints(110)).state).toBe('bottom')
    advanceStateClock(counter)
    expect(counter.update(createSquatKeypoints(140)).state).toBe('ascent')
    advanceStateClock(counter)
    const result = counter.update(createSquatKeypoints(170))

    expect(result.repCount).toBe(1)
    expect(result.state).toBe('standing')
  })

  test('counts a squat when only one leg is confidently visible', () => {
    const counter = new RepCounter('SQUAT')

    advanceStateClock(counter)
    counter.update(createSquatKeypoints(175, ['left']))
    advanceStateClock(counter)
    counter.update(createSquatKeypoints(145, ['left']))
    counter.update(createSquatKeypoints(110, ['left']))
    advanceStateClock(counter)
    counter.update(createSquatKeypoints(140, ['left']))
    advanceStateClock(counter)
    const result = counter.update(createSquatKeypoints(170, ['left']))

    expect(result.repCount).toBe(1)
  })
})
