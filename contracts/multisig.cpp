/*
 * @Description:
 * @Author: kay
 * @Date: 2021-06-16 15:56:31
 * @LastEditTime: 2021-08-24 16:05:48
 * @LastEditors: kay
 */

#include "multisig.hpp"

namespace dante {

void multisig::init(const std::set<std::string>& managers,
                    const uint8_t& requires) {
  manager_table.self().managers = managers;
  platon_assert(requires <= managers.size(),
                "mulitsig: requires exceed managers size.");
  manager_table.self().requires = requires;
}

bool multisig::propose(const std::string& proposal_name,
                       const Address& contract_addr,
                       const bytes& paras,
                       const int64_t& expiration) {
  require_manager();

  Address sender = platon_caller();
  platon_assert(!proposal_exists(proposal_name),
                "mulitsig: proposal already exists.");
  int64_t expire_time = get_expiration_time(expiration);
  general_proposals.insert(proposal_name,
                           GeneralProposal{expire_time, contract_addr, paras});
  PLATON_EMIT_EVENT2(Propose, sender, proposal_name, contract_addr, paras,
                     expire_time);
  return true;
}

bool multisig::propose_transfer(const std::string& proposal_name,
                                const Address& to,
                                const u128& amount,
                                const int64_t& expiration) {
  require_manager();

  Address sender = platon_caller();
  platon_assert(!proposal_exists(proposal_name),
                "mulitsig: proposal already exists.");
  int64_t expire_time = get_expiration_time(expiration);
  transfer_proposals.insert(proposal_name,
                            TransferProposal{expire_time, to, amount});
  PLATON_EMIT_EVENT2(ProposeTransfer, sender, proposal_name, to, amount,
                     expiration);
  return true;
};

bool multisig::propose_update_managers(
    const std::string& proposal_name,
    const std::set<std::string>& new_managers,
    const uint8_t& new_requires,
    const int64_t& expiration) {
  require_manager();

  Address sender = platon_caller();
  platon_assert(!proposal_exists(proposal_name),
                "mulitsig: proposal already exists.");
  int64_t expire_time = get_expiration_time(expiration);
  update_managers_proposals.insert(
      proposal_name,
      UpdateManagersProposal{new_requires, expire_time, new_managers, {}});
  PLATON_EMIT_EVENT2(ProposeUpdateManagers, sender, proposal_name, new_managers,
                     new_requires, expiration);
  return true;
}

bool multisig::approve(const std::string& proposal_name) {
  require_manager();

  Address sender = platon_caller();
  if (general_proposals.contains(proposal_name)) {
    platon_assert(
        general_proposals[proposal_name].expiration >= platon_timestamp(),
        "multisig: proposal has expired.");
    general_proposals[proposal_name].approvers.insert(sender.toString());
  } else if (transfer_proposals.contains(proposal_name)) {
    platon_assert(
        transfer_proposals[proposal_name].expiration >= platon_timestamp(),
        "multisig: proposal has expired.");
    transfer_proposals[proposal_name].approvers.insert(sender.toString());
  } else if (update_managers_proposals.contains(proposal_name)) {
    platon_assert(update_managers_proposals[proposal_name].expiration >=
                      platon_timestamp(),
                  "multisig: proposal has expired.");
    update_managers_proposals[proposal_name].approvers.insert(
        sender.toString());
  } else {
    platon_assert(false, "multisig: proposal not exists.");
  }
  PLATON_EMIT_EVENT1(Approve, sender, proposal_name);
  return true;
}

bool multisig::execute(const std::string& proposal_name) {
  require_manager();

  Address sender = platon_caller();
  auto managers = manager_table.self().managers;
  auto requires = manager_table.self().requires;
  // execute other propose
  if (general_proposals.contains(proposal_name)) {
    auto proposal = general_proposals[proposal_name];
    platon_assert(proposal.approvers.size() >= requires,
                  "mulitsig: not enough approvers.");
    auto result = multisig::platon_call(proposal.contract_addr, proposal.paras);
    if (result.second && result.first) {
      general_proposals.erase(proposal_name);
    } else {
      DEBUG("multisg: call other contract failed");
      platon_revert();
    }
    // execute transfer propose
  } else if (transfer_proposals.contains(proposal_name)) {
    auto transfer = transfer_proposals[proposal_name];
    platon_assert(transfer.approvers.size() >= requires,
                  "mulitsig: not enough approvers.");
    bool result = platon_transfer(transfer.to, Energon(transfer.amount));
    if (result) {
      transfer_proposals.erase(proposal_name);
    } else {
      DEBUG("multisg: transfer LAT failed");
      platon_revert();
    }
  } else if (update_managers_proposals.contains(proposal_name)) {
    auto update = update_managers_proposals[proposal_name];
    platon_assert(update.approvers.size() >= requires,
                  "mulitsig: not enough approvers.");
    manager_table.self().managers = update.managers;
    manager_table.self().requires = update.requires;
    update_managers_proposals.erase(proposal_name);
  } else {
    DEBUG("mulitsig: proposal not exists.");
    platon_revert();
  }
  PLATON_EMIT_EVENT1(Execute, sender, proposal_name);
  return true;
}

std::set<std::string> multisig::get_managers() {
  return manager_table.self().managers;
}

Address multisig::get_owner() {
  return owner();
}

uint8_t multisig::get_requires() {
  return manager_table.self().requires;
}

Proposal multisig::get_proposal(const std::string& proposal_name) {
  auto proposal = Proposal{};
  if (general_proposals.contains(proposal_name)) {
    proposal.general_proposal = general_proposals[proposal_name];
  }
  if (transfer_proposals.contains(proposal_name)) {
    proposal.transfer_proposal = transfer_proposals[proposal_name];
  }
  if (update_managers_proposals.contains(proposal_name)) {
    proposal.update_managers_proposal =
        update_managers_proposals[proposal_name];
  }
  return proposal;
}

}  // namespace dante