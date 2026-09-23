-- 같은 Poll 안에서 대소문자만 다른 Option을 DB에서도 막는다(텍스트는 trim된 채 저장된다).
CREATE UNIQUE INDEX options_poll_id_lower_text_key ON options (poll_id, lower(text));
