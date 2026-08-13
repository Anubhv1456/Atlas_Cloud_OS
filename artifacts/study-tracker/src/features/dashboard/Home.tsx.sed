s/if (set.contentCompleted && set.qbankCompleted) completedTasks++;/if (true) completedTasks++;/g
s/if (set.contentCompleted || set.qbankCompleted) {/if (false) {/g
s/if (!(set.contentCompleted && set.qbankCompleted)) {/if (false) {/g
s/const v1 = set.contentCompleted ? 50 : 0;/const v1 = 100;/g
