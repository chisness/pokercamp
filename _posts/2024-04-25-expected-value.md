---
title: "Poker Camp Section 2.2 Poker Math -- Expected Value"
date: 2024-04-25
sidebar:
  nav: "nav"
toc: true
toc_label: "TOC"
toc_sticky: true
---
Expected value is a very useful decision making concept. It's a way of assigning an expectation to unknown outcomes. 

If your uncle offered you $ \\$100 $ if you picked the number he was thinking of between $1$ and $10$, then your expected value would be $100*\frac{1}{10} = 10$ because $100$ is the payoff and $\frac{1}{10}$ is the probability that you correctly guess the number. 

The expected value is the average outcome of all possibilities weighted by their probabilities. It's found by multiplying the value and probability of every possible outcome and adding them all together. 

Mathematically, assume $k$ possible outcomes and a list of possible values $x_1, ..., x_k$, each of which has probability $p_1, ..., p_k$ of occurring, respectively. Then $\mathbb{E}[X] = x_1 p_1 + x_2 p_2 + ... + x_k p_k$. 

The goal of poker is to be profitable by making +EV plays. Note that the goal is to make profitable plays -- you can only affect how you play the hand, but not the result. 

The profitable part is *expected* to happen in the long run over a large enough sample size. Over a few hours or a few days, you might run into bad luck, but over a large enough number of hands, your results will converge to the expected value of all of your decisions. 

When we call a bet in poker, we don't just think about "are we winning?", but rather think about the expected value of the call. In poker and in many other real world cases, the expected value calculations are approximate, reflecting that there is often hidden and uncertain information.  

# Dice EV
The first EV example is often dice and we will go ahead and conform. If you are rolling a six-sided standard die, then the possibilities are: 

| Die Roll Value  | Probability |
| -------- | ------- |
| $1$  | $\frac{1}{6}$    |
| $2$ | $\frac{1}{6}$     |
| $3$    | $\frac{1}{6}$   |
| $4$  | $\frac{1}{6}$    |
| $5$ | $\frac{1}{6}$     |
| $6$    | $\frac{1}{6}$    |

Therefore the expected value of a single die roll is found by summing all outcomes multiplied by their probabilities: 

$$
\begin{equation}
\begin{split}
\mathbb{E}[\text{Die}] &= 1*\frac{1}{6} + 2*\frac{1}{6} + 3*\frac{1}{6} + 4*\frac{1}{6} + 5*\frac{1}{6} + 6*\frac{1}{6} \\
  &= 3.5
\end{split}
\end{equation}
$$

This means that you can expect to see a $3.5$ average.

# Basketball EV
A very simple basketball scenario is that you can shoot a 2-pointer with $55\%$ accuracy and a 3-pointer with $35\%$ accuracy. Which should you shoot? 

$\mathbb{E}[\text{2-pointer}] = 2*0.55 = 1.1$

$\mathbb{E}[\text{3-pointer}] = 3*0.35 = 1.05$

Therefore the 2-pointer has a slightly higher expected value. 

Suppose that the 2-pointer accuracy is definitely $55\%$. What accuracy would be needed to be indifferent between shooting a 2-pointer and 3-pointer? 

We know that the 2-pointer EV is $1.1$ from above. Therefore we can set the 3-pointer to be $1.1$ as well for indifference: 

$\mathbb{E}[\text{3-pointer}] = 1.1$ 

Let $x$ be the 3-pointer accuracy: 

$1.1 = 3*x \Rightarrow x = \frac{1.1}{3} = 0.37$

So to be indifferent to a $55\%$ 2-point accuracy, we'd need a $37\%$ 3-point accuracy. 

# Blackjack EV
Let's look at a simplified blackjack scenario to calculate the EV. The goal of blackjack is to sum your cards and get as close to possible to 21 without going over, which is called busting. 

Suppose that you bet $\$10$ and your current total is $16$ and the dealer, your opponent, has a total of $19$. (This is a major simplification because normally you wouldn't know the dealer's total, only 1 of their cards.)

Suppose also that the deck size is infinite, so we can ignore the cards that are already out and assume that each card is equally likely. 

Finally, let's assume that we will only take 1 card.

There are 4 categories of outcomes as shown below: 

| Cards    | Probability | Game Outcome | 
| -------- | ------- | ------- |
| A,2  | $\frac{2}{13}$    | Dealer wins (-10) | 
| 3 | $\frac{1}{13}$     | Tie (0) | 
| 4,5   | $\frac{2}{13}$   | We win (+10) | 
| 6,7,8,9,T,J,Q,K  | $\frac{8}{13}$    | Bust, dealer wins (-10) | 

What is the EV of the next card for this player? 

$$
\begin{equation}
\begin{split}
\mathbb{E}[\text{Next Card}] &= (-10)*\frac{2}{13} + 0*\frac{1}{13} + (10)*\frac{2}{13} + (-10)*\frac{8}{13} \\
  &= -1.54 + 0 + 1.54 - 6.15 \\
  &= -6.15
\end{split}
\end{equation}
$$

On average, given this scenario, the player will lose $\$6.15$. $16$ is generally a tough blackjack spot because it's not good enough to stay, but most cards result in a bust.

Note that even though the long run expectation is a loss of $\$6.15$, it's very feasible to win twice or more times in a row

# Poker EV
Now that we have a sense for how EV works, let's get back to the reason that we're here: poker. 

Equity is share of the pot that you would receive with no future betting. 

## Tournament Winner
Suppose that you're playing a 10-player tournament with friends where the entry fee is $\$100$. 1st place gets back $\$900$ and 2nd place gets their $\$100$ entry fee back. 

Suppose that you believe that your chances of winning are 15% and 2nd place is 10%. What is your EV for entering the tournament? 

$$
\begin{equation}
\begin{split}
\mathbb{E}[\text{Tournament}] &= (0.1)*0 + (0.15)*800 \\
  &= 0 + 120 \\
  &= 120
\end{split}
\end{equation}
$$

This means that your expected return on investment (ROI) is $\frac{20}{100} = 0.20 = 20\%$. 

## Assumptions
Expected value requires you to make estimates and assumptions and the results are dependent on them. In this last example you're making estimates about your skill level relative to other players at the table. In other cases in poker you'll be making estimates about how likely an opponent is to fold, how likely they are to be bluffing, and how likely their hand is to be of a certain strength. As a result, there is a lot of skill in modeling the scenarios well and getting accurate expected values.   

## Calling a Bet on the River
This is a very common poker scenario: Your opponent bets on the river and you have to decide whether to call or not. For the first example, we'll keep things simple and only look at calling and folding. 

Suppose that you have J♥T♣ and the board is 2♠5♥T♥9♦2♦ and the pot size is $50$ (you and this opponent have each put in $25$ so far). The opponent goes all-in for $50$. 

Let's look at the outcomes *from the point of the allin*, i.e. not considering chips already put into the pot as a loss, but rather as a sunk cost. 

What are the possible outcomes? 
- Call and win: Win the $50$ pot + $50$ opponent bet, total $100$
- Call and lose: Lose the $50$ bet
- Fold and lose: $0$

Let's assume that each of these occur $\frac{1}{3}$ of the time. 

$$
\begin{equation}
\begin{split}
\mathbb{E}[\text{Facing Allin}] &= (100)*\frac{1}{3} + (-50)*\frac{1}{3} + (0)*\frac{1}{3} \\
  &= 33.33 + (-16.67) + 0 \\
  &= 16.67
\end{split}
\end{equation}
$$

## EV Reference Points
Note that from the point of the allin, the fold is always $0$. Let's consider the same example, but with overall profits on the hand rather than from that river decision point. 

One important note is that once chips are in the pot, they are no longer ours, so calculations from any particular point do not assume that chips previously put in the pot are losses. 

- Call and win: Win the $150$ pot, half is your profit, so $75$
- Call and lose: Lose the $150$ pot, half is your loss, so $-75$
- Fold and lose: $-25$ already in the pot

$$
\begin{equation}
\begin{split}
\mathbb{E}[\text{Facing Allin Reference Point}] &= (75)*\frac{1}{3} + (-75)*\frac{1}{3} + (-25)*\frac{1}{3} \\
  &= 25 - 25 - 8.33 \\
  &= -8.33
\end{split}
\end{equation}
$$

What happened here? Note that the EV of folding went from $0$ to $(-25)*\frac{1}{3} = -8.33$. All other EVs were also shifted by this amount, so the relative difference between the EV of all options is the same, but the absolute numbers change.  

$\text{EV River Reference} = \text{EV Overall Reference} - \text{EV Fold at Overall Reference}

## Going Allin Preflop as the Small Blind
Use bb instead of chips

## Calling a Bet on the Turn with Equity
probability of flush/outs too 

## Semibluffing on the Turn

## Fold EV and Showdown EV 
Fold deny bluffing, deny equity, make better hands fold

Showdown worse hands call 