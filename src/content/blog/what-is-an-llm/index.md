---
title: "What is an LLM?"
description: "A large language model is a next-token predictor trained on enormous amounts of text. Almost everything else follows from that one sentence."
pubDate: 2026-08-31
category: "Engineering"
tags: ["ai", "llm"]
series: "What Is"
draft: true
---

## The short answer

A **large language model** is a program that predicts the next chunk of text,
given the text so far. It learned to do that by being shown an enormous amount
of writing. That is the whole mechanism. Everything that feels like reasoning,
style, or knowledge is a consequence of doing that one thing extremely well at
scale.

## Why it exists

For most of computing history, getting a machine to handle language meant
writing rules. Grammars, parsers, dictionaries, hand-built ontologies. It worked
for narrow slices and fell apart everywhere else, because language does not sit
still long enough to be enumerated. Every rule you write has a Tuesday on which
someone breaks it and is still understood perfectly.

The alternative was to stop writing rules and start learning them from examples.
That idea is old. What made it work was a change in architecture — the
transformer, introduced in 2017 — which let models look at every part of their
input at once instead of shuffling through it word by word. That turned out to
be something you could scale. Feed a transformer more text and more compute, and
it does not just get marginally better at the training task; it starts handling
tasks nobody trained it for.

So LLMs exist because "learn the patterns from a lot of text" beat "write down
the rules" by a wide enough margin that the rules approach stopped being worth
maintaining.

## How it actually works

Four steps, and none of them are mysterious on their own.

**1. Text becomes tokens.** The model does not see letters or words. It sees
tokens — fragments of text, roughly a word or a piece of one. "Understanding"
might arrive as two or three tokens. This is a compression choice, and it is the
source of a surprising number of the model's quirks.

**2. Tokens become vectors.** Each token is mapped to a list of numbers that
encodes something about its meaning and position. Related ideas land near each
other in that space, which is why a model can connect "physician" to "doctor"
without being told they are related.

**3. The stack does its work.** Those vectors pass through many layers of
attention. Attention lets each token pull in information from the other tokens
in context — so "bank" resolves differently next to "river" than next to "loan".
Stack enough of those layers and the representation at the top carries a lot of
structure.

**4. Out comes a probability distribution.** Not an answer — a ranked list over
every token it knows, with a probability on each. Something then picks one. Pick
the highest-probability token every time and the output goes flat and repetitive;
sample with a little randomness and it reads like prose. That knob is why the
same question can produce different answers.

Then the loop: the chosen token gets appended to the input, and the whole thing
runs again for the next one. A paragraph is that loop, several hundred times.

Training is the same mechanism pointed backwards. Show the model text with the
next token hidden, let it guess, measure how wrong it was, nudge its parameters,
repeat at enormous scale. It is not memorising sentences. It is being pushed,
gradually, into a shape that makes good predictions about text in general.

## What it is not

This is where most of the confusion lives, so it is worth being precise.

- **It is not a database.** It has no rows to look up. Facts are smeared across
  its parameters as statistical tendencies, which is why it can be confidently
  wrong in a way a lookup never is.
- **It is not a search engine.** On its own it has no access to anything outside
  its input. When a chat assistant cites a live web page, something else fetched
  that page and put it in the model's context.
- **It is not the product you use.** ChatGPT and Claude are applications *around*
  a model — tools, memory, retrieval, safety layers, interface. The model is the
  engine, not the car.
- **It does not learn from your conversation.** Its parameters are frozen after
  training. Within a chat it appears to learn because everything said so far is
  fed back in as input. Close the window and that is gone.
- **It has no persistent state between calls.** Each request is answered fresh
  from whatever text it was handed.

## Where it breaks

- **Confident fabrication.** The model is optimised to produce plausible text,
  and a fluent wrong answer scores well on plausibility. There is no internal
  signal separating "I know this" from "this pattern fits".
- **A fixed context budget.** Everything it can consider must fit in a bounded
  window of tokens. Past that edge, earlier material is simply gone.
- **A knowledge cutoff.** Training ended on a date. Anything after it is
  invisible unless something puts it into the context.
- **Character-level blindness.** Because it reads tokens, not letters, questions
  about spelling and letter counts hit an awkward seam.
- **Sensitivity to phrasing.** The same question asked two ways can get two
  different answers. Sometimes that is real ambiguity. Sometimes it is noise.

None of these are bugs awaiting a patch. They fall out of the design. Knowing
that is the difference between using one of these things well and being
repeatedly surprised by it.

## The one-line version

**An LLM is a next-token predictor trained at a scale where predicting text well
starts to look like understanding it — and the gap between those two things is
where every one of its failure modes lives.**
