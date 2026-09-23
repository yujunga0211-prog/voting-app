# Results는 투표한 Voter에게만 공개

결과를 먼저 보고 한쪽으로 쏠리는 투표(밴드왜건 효과)를 줄이기 위해, Results는 해당 Poll에 Vote를 한 Voter에게만 보인다. 이를 지키기 위해 결과 전용 URL(`/polls/[id]/results`)을 두지 않고 `/polls/[id]` 하나가 Voter 상태에 따라 투표 폼 또는 결과를 렌더링하며, 홈 목록에도 득표수·총 투표 수를 표시하지 않는다(질문 문장과 생성 시각만).
